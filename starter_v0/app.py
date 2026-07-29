from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

import streamlit as st

from env_loader import load_lab_env
from providers import make_provider
from tools import load_tool_declarations, to_openai_tools
from chat import run_model_tool_loop, write_transcript, trim_history, safe_slug
from versioning import build_artifact_version, artifact_version_dict

ROOT = Path(__file__).parent
ARTIFACTS_DIR = ROOT / "artifacts"
load_lab_env(ROOT)

st.set_page_config(
    page_title="Research Agent - Day 04 Lab v2",
    page_icon="🔬",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown("""
<style>
    .stApp {
        background-color: #0f172a;
        color: #f8fafc;
    }
    .main-header {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    .version-badge {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        padding: 4px 12px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.85rem;
    }
    .tool-card {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 12px 16px;
        margin-top: 8px;
        margin-bottom: 8px;
    }
    .tool-name {
        color: #38bdf8;
        font-weight: bold;
        font-family: monospace;
    }
    .status-badge {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: bold;
    }
    .status-answered { background-color: #064e3b; color: #34d399; }
    .status-waiting { background-color: #78350f; color: #fbbf24; }
    .status-error { background-color: #7f1d1d; color: #f87171; }
</style>
""", unsafe_allow_html=True)


def init_session() -> None:
    if "messages" not in st.session_state:
        st.session_state.messages = []
    if "history" not in st.session_state:
        st.session_state.history = []
    if "turns" not in st.session_state:
        st.session_state.turns = []
    if "transcript_id" not in st.session_state:
        st.session_state.transcript_id = f"ui_{datetime.now().strftime('%Y%m%dT%H%M%S')}"


init_session()

# --- Sidebar Controls ---
with st.sidebar:
    st.title("⚙️ Control Panel")
    
    provider_name = st.selectbox(
        "Model Provider",
        options=["gemini", "openrouter", "openai", "anthropic"],
        index=0,
    )
    
    version_label = st.selectbox(
        "Artifact Version",
        options=["v0", "v1", "v2", "v3"],
        index=3,
        help="Select artifact prompt & tool declaration version"
    )

    custom_model = st.text_input(
        "Override Model (optional)",
        value="",
        placeholder="e.g. gemini-2.0-flash",
    )

    max_rounds = st.slider("Max Tool Rounds", min_value=1, max_value=8, value=4)

    st.markdown("---")
    if st.button("🗑️ Clear Session & History", use_container_width=True):
        st.session_state.messages = []
        st.session_state.history = []
        st.session_state.turns = []
        st.session_state.transcript_id = f"ui_{datetime.now().strftime('%Y%m%dT%H%M%S')}"
        st.rerun()

    # Load prompt & tools
    system_prompt_file = ARTIFACTS_DIR / "system_prompt.md"
    tools_file = ARTIFACTS_DIR / "tools.yaml"
    
    system_prompt_text = system_prompt_file.read_text(encoding="utf-8") if system_prompt_file.exists() else ""
    tool_decls = load_tool_declarations(tools_file) if tools_file.exists() else []
    artifact_ver = build_artifact_version(version_label, system_prompt_file, tools_file)

    st.markdown("### 📊 Active Version Info")
    st.markdown(f"**Version**: <span class='version-badge'>{version_label}</span>", unsafe_allow_html=True)
    st.markdown(f"**Prompt Hash**: `{artifact_ver.prompt_hash[:10]}`")
    st.markdown(f"**Tools Hash**: `{artifact_ver.tools_hash[:10]}`")
    st.markdown(f"**Loaded Tools**: `{len(tool_decls)} tools`")

# --- Main App Header ---
st.markdown("""
<div class="main-header">
    <h2>🔬 Research Agent Dashboard</h2>
    <p style="color: #94a3b8; margin: 0;">Evidence-driven Multi-Tool Research Assistant — Day 04 Lab v2</p>
</div>
""", unsafe_allow_html=True)

# Render Chat History
for turn in st.session_state.turns:
    with st.chat_message("user"):
        st.write(turn["user"])

    with st.chat_message("assistant"):
        if turn.get("assistant_text"):
            st.write(turn["assistant_text"])

        # Display Tool Call Trace
        tool_events = turn.get("tool_events", [])
        if tool_events:
            with st.expander(f"🛠️ Tool Execution Trace ({len(tool_events)} call{'s' if len(tool_events)>1 else ''})"):
                for idx, ev in enumerate(tool_events, 1):
                    tool_name = ev.get("tool", "unknown")
                    tool_args = ev.get("args", {})
                    tool_res = ev.get("result", {})
                    
                    is_err = "error" in tool_res or "error" in str(tool_res)
                    status_class = "status-error" if is_err else "status-answered"
                    status_label = "ERROR" if is_err else "SUCCESS"
                    
                    st.markdown(f"""
                    <div class="tool-card">
                        <span class="tool-name">#{idx} {tool_name}</span>
                        <span class="status-badge {status_class}">{status_label}</span>
                        <div style="margin-top: 6px;"><b>Arguments:</b> <code>{json.dumps(tool_args, ensure_ascii=False)}</code></div>
                    </div>
                    """, unsafe_allow_html=True)
                    st.json(tool_res, expanded=False)

# Chat Input Form
if user_prompt := st.chat_input("Enter your research request or follow-up question..."):
    with st.chat_message("user"):
        st.write(user_prompt)

    with st.chat_message("assistant"):
        with st.spinner("Agent is reasoning and executing tools..."):
            try:
                provider = make_provider(provider_name)
                selected_model = custom_model if custom_model.strip() else getattr(provider, "default_model", None)
                openai_tools = to_openai_tools(tool_decls)

                messages = [
                    {"role": "system", "content": system_prompt_text},
                    *trim_history(st.session_state.history, window=5),
                    {"role": "user", "content": user_prompt},
                ]

                result = run_model_tool_loop(
                    provider=provider,
                    messages=messages,
                    tools=openai_tools,
                    model=selected_model,
                    max_tool_rounds=max_rounds,
                )

                assistant_reply = result.get("assistant_text", "")
                st.write(assistant_reply)

                tool_events = result.get("tool_events", [])
                if tool_events:
                    with st.expander(f"🛠️ Tool Execution Trace ({len(tool_events)} call{'s' if len(tool_events)>1 else ''})", expanded=True):
                        for idx, ev in enumerate(tool_events, 1):
                            tool_name = ev.get("tool", "unknown")
                            tool_args = ev.get("args", {})
                            tool_res = ev.get("result", {})
                            
                            is_err = "error" in tool_res or "error" in str(tool_res)
                            status_class = "status-error" if is_err else "status-answered"
                            status_label = "ERROR" if is_err else "SUCCESS"

                            st.markdown(f"""
                            <div class="tool-card">
                                <span class="tool-name">#{idx} {tool_name}</span>
                                <span class="status-badge {status_class}">{status_label}</span>
                                <div style="margin-top: 6px;"><b>Arguments:</b> <code>{json.dumps(tool_args, ensure_ascii=False)}</code></div>
                            </div>
                            """, unsafe_allow_html=True)
                            st.json(tool_res, expanded=False)

                # Save turn & history
                turn_record = {
                    "turn_index": len(st.session_state.turns) + 1,
                    "started_at": datetime.now().isoformat(),
                    "user": user_prompt,
                    "status": result.get("status", "completed"),
                    "assistant_text": assistant_reply,
                    "rounds": result.get("rounds", []),
                    "tool_events": tool_events,
                    "ended_at": datetime.now().isoformat(),
                }
                st.session_state.turns.append(turn_record)
                st.session_state.history.append({"role": "user", "content": user_prompt})
                st.session_state.history.append({"role": "assistant", "content": assistant_reply})

                # Write transcript file
                transcripts_dir = ROOT / "transcripts"
                transcript_file = transcripts_dir / f"{st.session_state.transcript_id}.transcript.json"
                transcript_data = {
                    "transcript_id": st.session_state.transcript_id,
                    **artifact_version_dict(artifact_ver),
                    "provider": provider_name,
                    "model": selected_model,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat(),
                    "turns": st.session_state.turns,
                }
                write_transcript(transcript_file, transcript_data)

            except Exception as exc:
                st.error(f"Execution Error: {type(exc).__name__}: {str(exc)}")
