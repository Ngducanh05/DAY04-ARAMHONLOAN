# UI plan — Research Agent Lab

Mục tiêu UI là làm rõ 4 thứ mà team cần khi demo:

1. người dùng nhập gì;
2. agent trả gì;
3. tool nào được gọi, với args nào, ở round nào;
4. version nào đang được xem và kết quả đã cải thiện ra sao.

## 1) Cấu trúc trang

### A. Top bar

- tên project
- badge version hiện tại: `v0 / v1 / v2 / v3`
- provider/model đang dùng
- trạng thái kết nối / trạng thái run

### B. Sidebar điều khiển

- chọn artifact version
- chọn provider/model
- chọn run/transcript để mở lại
- nút reload data
- nút export snapshot

### C. Khu chat chính

- timeline message theo kiểu chat
- ô nhập prompt
- nút gửi
- nút chọn scenario demo nhanh
- hiển thị multi-turn context rõ ràng

### D. Tool trace panel

- round number
- tool name
- args
- result / error
- status của round
- highlight khi tool sai boundary hoặc gọi thừa

### E. Evidence panel

- run JSON summary
- artifact hash / prompt hash / tools hash
- metric summary
- link transcript
- link run JSON

## 2) Information architecture

Trang nên chia 2 cột:

- cột trái: chat + quick scenarios
- cột phải: trace + run summary + transcript

Lý do: khi demo, người nghe cần vừa thấy user-facing output, vừa thấy bằng chứng nội bộ ngay cạnh nó.

## 3) Các view cần có

### View 1 — Live chat

Cho nhập câu hỏi thật, thấy agent phản hồi và tool trace theo từng round.

### View 2 — Run inspector

Mở một run JSON đã lưu, xem:

- version
- prompt hash
- tools hash
- tool calls
- failures
- observed mismatch

### View 3 — Version comparison

So sánh 2–4 version trên cùng scenario:

- routing accuracy
- argument accuracy
- multiturn accuracy
- failure counts

## 4) Component list

- `AppShell`
- `VersionSelector`
- `ProviderSelector`
- `ScenarioPicker`
- `ChatTimeline`
- `MessageBubble`
- `ToolTraceList`
- `ToolTraceCard`
- `RunSummaryCard`
- `ArtifactMetaCard`
- `FileLinkRow`
- `MetricChip`

## 5) Data contract

Frontend nên tiêu thụ một schema thống nhất từ backend, tối thiểu gồm:

- `transcript`
- `turns`
- `rounds`
- `tool_events`
- `artifact_version`
- `prompt_hash`
- `tools_hash`
- `summary`

## 6) Phần cần làm tiếp

1. tạo scaffold React Vite;
2. dựng layout 2 cột;
3. nối dữ liệu mock trước;
4. thay mock bằng file JSON thật từ `runs/` và `transcripts/`;
5. nếu cần, thêm API wrapper mỏng cho `chat.py`/`run_eval.py`.

