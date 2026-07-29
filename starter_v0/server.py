from __future__ import annotations

import json
import os
import sys
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Any

import yaml
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ROOT = Path(__file__).parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from env_loader import load_lab_env
from providers import make_provider
from tools import load_tool_declarations, to_openai_tools
from versioning import build_artifact_version, artifact_version_dict

# ─── Paths ───────────────────────────────────────────────────────────────────

ROOT = Path(__file__).parent
ARTIFACTS_DIR = ROOT / "artifacts"
TRANSCRIPTS_DIR = ROOT / "transcripts"
SYSTEM_PROMPT_PATH = ARTIFACTS_DIR / "system_prompt.md"
TOOLS_PATH = ARTIFACTS_DIR / "tools.yaml"

load_lab_env(ROOT)


# ─── App state ───────────────────────────────────────────────────────────────

class AppState:
    provider: Any = None
    system_prompt: str = ""
    tool_declarations: list[dict[str, Any]] = []
    openai_tools: list[dict[str, Any]] = []
    version: str = "v3"


_state = AppState()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load everything once
    _state.version = os.getenv("AGENT_VERSION", "v3")
    provider_name = os.getenv("AGENT_PROVIDER", "openrouter")

    _state.system_prompt = SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")
    _state.tool_declarations = load_tool_declarations(TOOLS_PATH)
    _state.openai_tools = to_openai_tools(_state.tool_declarations)

    try:
        _state.provider = make_provider(provider_name)
    except Exception as e:
        print(f"[WARN] Provider init failed: {e}. Set OPENROUTER_API_KEY / GEMINI_API_KEY etc.")
        _state.provider = None

    TRANSCRIPTS_DIR.mkdir(exist_ok=True)
    print(f"✅ Robotics Research Agent ready | version={_state.version} | provider={provider_name}")
    print(f"   Tools loaded: {[t['name'] for t in _state.tool_declarations]}")
    yield


# ─── FastAPI app ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="Robotics Research Agent API",
    description=(
        "Backend API for the Robotics Research Agent. "
        "Finds news, papers, tweets, and specs about robotics. "
        "POST /chat to interact; GET /tools to see available tools."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Frontend thay đổi origin này nếu cần
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Schemas ─────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: str = ""
    version: str = "v3"
    history: list[dict[str, str]] = []   # Previous turns: [{role, content}, ...]


class ToolCallLog(BaseModel):
    name: str
    args: dict[str, Any]


class ToolResultLog(BaseModel):
    tool: str
    args: dict[str, Any] = {}
    result: Any = None
    error: str | None = None


class RoundLog(BaseModel):
    round: int
    assistant_text: str | None
    tool_calls: list[ToolCallLog]
    tool_results: list[dict[str, Any]]


class ChatResponse(BaseModel):
    session_id: str
    status: str
    assistant_text: str
    rounds: list[dict[str, Any]]
    tool_events: list[dict[str, Any]]
    artifact_version: str
    error: str | None = None


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def _save_transcript(session_id: str, request: ChatRequest, response_data: dict[str, Any]) -> None:
    try:
        ts = datetime.now().strftime("%Y%m%dT%H%M%S")
        safe_sid = "".join(c if c.isalnum() else "_" for c in session_id) or "anon"
        path = TRANSCRIPTS_DIR / f"{request.version}_{safe_sid}_{ts}.transcript.json"
        payload = {
            "session_id": session_id,
            "version": request.version,
            "user_message": request.message,
            "history_turns": len(request.history),
            "created_at": _now_iso(),
            **response_data,
        }
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    except Exception as e:
        print(f"[WARN] Failed to save transcript: {e}")


# ─── Core tool loop (imported logic from chat.py) ─────────────────────────────

def _run_tool_loop(messages: list[dict[str, Any]], max_rounds: int = 4) -> dict[str, Any]:
    """Run the agent tool loop. Mirrors run_model_tool_loop from chat.py."""
    from tools import TOOL_FUNCTIONS
    from providers.base import ToolCall

    working = list(messages)
    rounds: list[dict[str, Any]] = []
    all_events: list[dict[str, Any]] = []

    for round_idx in range(1, max_rounds + 1):
        response = _state.provider.complete(
            working, _state.openai_tools, temperature=0.0
        )
        calls: list[ToolCall] = response.tool_calls
        round_record: dict[str, Any] = {
            "round": round_idx,
            "assistant_text": response.text,
            "tool_calls": [{"name": c.name, "args": c.args} for c in calls],
            "tool_results": [],
        }

        if not calls:
            rounds.append(round_record)
            return {
                "status": "answered",
                "assistant_text": response.text or "",
                "rounds": rounds,
                "tool_events": all_events,
            }

        # Build assistant turn for context
        call_summary = [{"name": c.name, "args": c.args} for c in calls]
        working.append({
            "role": "assistant",
            "content": (response.text or "Calling tools.") + f"\n\nTOOL_CALLS_JSON:\n{json.dumps(call_summary, ensure_ascii=False)}",
        })

        non_clarify_events: list[dict[str, Any]] = []

        for call in calls:
            func = TOOL_FUNCTIONS.get(call.name)
            if not func:
                event = {"tool": call.name, "args": call.args, "result": {"error": "unknown_tool"}}
            else:
                try:
                    result = func(**call.args)
                except Exception as exc:
                    result = {"error": type(exc).__name__, "message": str(exc)}
                event = {"tool": call.name, "args": call.args, "result": result}

            round_record["tool_results"].append(event)
            all_events.append(event)

            # Detect clarify/pause
            res = event.get("result", {})
            if isinstance(res, dict) and res.get("awaiting_user"):
                question = res.get("question") or call.args.get("question") or "Bạn bổ sung thêm thông tin nhé."
                rounds.append(round_record)
                return {
                    "status": "waiting_for_user",
                    "assistant_text": question,
                    "rounds": rounds,
                    "tool_events": all_events,
                }

            non_clarify_events.append(event)

        rounds.append(round_record)

        # Feed tool results back
        results_text = (
            "TOOL_RESULTS_JSON:\n"
            + json.dumps(non_clarify_events, ensure_ascii=False, indent=2, default=str)[:24000]
            + "\n\nUse only these tool results. If items are ready for a digest, call format. Otherwise answer directly."
        )
        working.append({"role": "user", "content": results_text})

    return {
        "status": "max_tool_rounds",
        "assistant_text": f"Stopped after {max_rounds} tool rounds.",
        "rounds": rounds,
        "tool_events": all_events,
    }


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/health")
async def health() -> dict[str, Any]:
    """Health check — xác nhận server đang chạy."""
    return {
        "status": "ok",
        "version": _state.version,
        "agent": "Robotics Research Agent",
        "provider_ready": _state.provider is not None,
        "tools_loaded": len(_state.tool_declarations),
        "timestamp": _now_iso(),
    }


@app.get("/tools")
async def get_tools() -> dict[str, Any]:
    """Trả về danh sách tool mà agent đang có."""
    tools = [
        {
            "name": t["name"],
            "description": (t.get("description") or "").strip()[:200],
            "required_params": (
                t.get("parameters", {}).get("required", [])
            ),
        }
        for t in _state.tool_declarations
    ]
    return {"tools": tools, "count": len(tools)}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    """
    Gửi tin nhắn đến Robotics Research Agent.

    - `message`: câu hỏi của user (tiếng Việt hoặc tiếng Anh).
    - `session_id`: tuỳ chọn, dùng để nhóm các lượt trong cùng phiên.
    - `history`: danh sách các lượt hội thoại trước (role + content).
    - `version`: phiên bản artifact (v0/v1/v2/v3).
    """
    if not _state.provider:
        raise HTTPException(
            status_code=503,
            detail="Agent provider not initialized. Please set OPENROUTER_API_KEY (or GEMINI_API_KEY etc.) in .env",
        )

    import uuid
    session_id = req.session_id or str(uuid.uuid4())[:8]

    # Build message list
    messages: list[dict[str, Any]] = [
        {"role": "system", "content": _state.system_prompt},
        *req.history[-10:],  # Keep last 10 turns for context
        {"role": "user", "content": req.message},
    ]

    try:
        result = _run_tool_loop(messages)
    except Exception as exc:
        return ChatResponse(
            session_id=session_id,
            status="error",
            assistant_text="",
            rounds=[],
            tool_events=[],
            artifact_version="error",
            error=f"{type(exc).__name__}: {str(exc)}",
        )

    artifact_version = build_artifact_version(req.version, SYSTEM_PROMPT_PATH, TOOLS_PATH)

    response_data = {
        "session_id": session_id,
        "status": result["status"],
        "assistant_text": result["assistant_text"],
        "rounds": result["rounds"],
        "tool_events": result["tool_events"],
        "artifact_version": artifact_version.artifact_version,
    }

    _save_transcript(session_id, req, response_data)

    return ChatResponse(**response_data)


@app.get("/transcripts")
async def list_transcripts() -> dict[str, Any]:
    """Danh sách transcript đã lưu."""
    files = sorted(TRANSCRIPTS_DIR.glob("*.transcript.json"), reverse=True)
    return {
        "transcripts": [f.name for f in files[:50]],
        "total": len(files),
    }


@app.get("/transcripts/{filename}")
async def get_transcript(filename: str) -> Any:
    """Đọc nội dung một transcript cụ thể."""
    # Basic path safety
    if "/" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    path = TRANSCRIPTS_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Transcript not found")
    return json.loads(path.read_text(encoding="utf-8"))


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "name": "Robotics Research Agent API",
        "docs": "/docs",
        "health": "/health",
        "chat": "POST /chat",
        "tools": "GET /tools",
    }
