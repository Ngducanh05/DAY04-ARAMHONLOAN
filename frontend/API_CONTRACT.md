# Frontend ↔ FastAPI contract

Default local flow:

- frontend: `http://localhost:5173`
- backend: `http://localhost:8000`
- frontend calls `/api/*`; Vite rewrites it to the backend root.

Set `VITE_API_BASE_URL` when the backend is deployed separately.

## Existing backend APIs

### `GET /`

Input: none.

Output: API name plus links for `/docs`, `/health`, `/chat`, and
`/tools`. This is informational and is not required by the frontend.

### `GET /health`

Input: none.

Output:

```json
{
  "status": "ok",
  "version": "v3",
  "agent": "Robotics Research Agent",
  "provider_ready": true,
  "tools_loaded": 15,
  "timestamp": "2026-07-29T15:30:00"
}
```

### `GET /tools`

Input: none.

Output:

```json
{
  "tools": [
    {
      "name": "lookup",
      "description": "...",
      "required_params": ["query"]
    }
  ],
  "count": 15
}
```

### `POST /chat`

Input:

```json
{
  "message": "Tin robotics hôm nay có gì?",
  "session_id": "",
  "version": "v3",
  "history": [
    { "role": "user", "content": "Earlier request" },
    { "role": "assistant", "content": "Earlier response" }
  ]
}
```

Output:

```json
{
  "session_id": "5fd21bfb",
  "status": "answered",
  "assistant_text": "...",
  "rounds": [
    {
      "round": 1,
      "assistant_text": null,
      "tool_calls": [{ "name": "lookup", "args": {} }],
      "tool_results": [{ "tool": "lookup", "args": {}, "result": {} }]
    }
  ],
  "tool_events": [],
  "artifact_version": "v3+p...+t...",
  "error": null
}
```

### `GET /transcripts`

Input: none.

Output:

```json
{
  "transcripts": ["v3_5fd21bfb_20260729T152320.transcript.json"],
  "total": 3
}
```

### `GET /transcripts/{filename}`

Input: transcript filename as a URL path parameter.

Output: the complete stored transcript JSON.

## API endpoints added by the updated backend

### 1. `GET /runs`

Input: optional query parameters `version`, `suite`, and `limit`.

Required output:

```json
{
  "runs": [
    {
      "run_id": "v3_B_group_...",
      "version": "v3",
      "suite": "group",
      "generated_at": "...",
      "summary": {}
    }
  ],
  "total": 4
}
```

### 2. `GET /runs/{run_id}`

Input: `run_id` as a URL path parameter.

Required output:

```json
{
  "run_id": "v3_B_group_...",
  "version": "v3",
  "artifact_version": "v3+p...+t...",
  "prompt_hash": "...",
  "tools_hash": "...",
  "generated_at": "...",
  "summary": {},
  "results": []
}
```

### 3. `GET /artifacts/current?version=v3`

Input: `version` query parameter.

Required output:

```json
{
  "version": "v3",
  "artifact_version": "v3+p...+t...",
  "prompt_hash": "...",
  "tools_hash": "...",
  "provider": "openrouter",
  "model": "openai/gpt-4o-mini"
}
```

### 4. Transcript filename in `POST /chat`

Input: unchanged from the existing `POST /chat` request.

Add `transcript_filename` and `generated_at` to the chat response so the
frontend can link the exact saved evidence without guessing from
`GET /transcripts`.

Required output addition:

```json
{
  "transcript_filename": "v3_5fd21bfb_20260729T152320.transcript.json",
  "generated_at": "2026-07-29T15:23:20"
}
```

### 5. `GET /versions`

Input: none, or optional `suite` query parameter.

Required output:

```json
{
  "versions": [
    {
      "version": "v3",
      "artifact_version": "v3+p...+t...",
      "metrics": {
        "case_accuracy": 0.8,
        "tool_routing_accuracy": 0.9,
        "argument_accuracy": 0.8,
        "multiturn_accuracy": 0.8
      }
    }
  ]
}
```

### 6. `GET /config` or provider fields in `POST /chat`

The backend currently chooses one provider from `AGENT_PROVIDER` at startup,
but `GET /health` does not expose its name/model and `POST /chat` cannot
select them.

Suggested input when provider selection is allowed per request:

```json
{
  "message": "Tin robotics hôm nay có gì?",
  "provider": "openrouter",
  "model": "openai/gpt-4o-mini"
}
```

Suggested `GET /config` output:

```json
{
  "provider": "openrouter",
  "model": "openai/gpt-4o-mini",
  "selectable_providers": ["openrouter", "openai", "anthropic", "gemini"]
}
```

## Backend caveats found during runtime check

- Run list currently returns an empty `generated_at` because the backend
  reads `timestamp/run_at`, while run JSON uses `generated_at`.
- `/artifacts/current` hashes the active root artifacts; its v3 hash can
  differ from the historical hash recorded by `/versions`.
- `/versions` derives routing/argument/multiturn values from case accuracy
  instead of reading those metrics from each run summary.
- `provider/model` fields are accepted by `POST /chat`, but the backend
  still uses startup configuration from `AGENT_PROVIDER/AGENT_MODEL`.
- Run `uvicorn app:app --reload --port 8000`. `server.py` is the legacy
  API and does not expose the added runs/artifacts/versions/config endpoints.

The frontend uses real API data in Live API mode. Mock data is only used by
the explicit Fallback mode.
