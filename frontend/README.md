# Frontend — React + Vite

Frontend này là evidence console cho lab research agent. Hiện tại UI chạy độc lập bằng mock data để team có thể demo trước khi backend hoàn thiện.

Mục tiêu chính:

- chọn provider / version;
- nhập prompt và chạy chat;
- xem trace tool theo từng round;
- xem run JSON / transcript / version log;
- hỗ trợ so sánh v0 → v3 trên cùng một scenario.

## Chạy local

```bash
npm install
npm run dev
```

Kiểm tra production bundle:

```bash
npm run build
```

## Mock evidence hiện có

Trang đang có sẵn scenario chính `AI news briefing`, gồm 2 round:

1. `lookup` với args và danh sách source mock.
2. `format` với digest mock.

Nút `Live mock / Fallback` cho phép trình diễn cả hai trạng thái. Fallback hiển thị `PROVIDER_TIMEOUT`, fallback run/transcript path và vẫn giữ nguyên tool trace để demo không phụ thuộc mạng.

## Contract để ghép backend sau này

Thay `liveEvidence` và `fallbackEvidence` trong `src/App.jsx` bằng adapter fetch/API, giữ các field sau:

- `run`: `run_id`, `version`, `artifact_version`, `prompt_hash`, `tools_hash`, `provider`, `model`, `generated_at`, `status`, `summary`, `files`;
- `transcript.turns[]`: `user`, `assistant_text`, `status`, `rounds[]`;
- `rounds[].tool_calls[]`: `name`, `args`;
- `rounds[].tool_results[]`: `tool`, `status`, `result` hoặc `error`.

Frontend không tự dựng agent loop. Khi backend xong, chỉ cần map output từ `runs/*.json` và `transcripts/*.transcript.json` vào contract trên; giữ fallback snapshot để UI vẫn mở được khi provider timeout.
