# Frontend — React + Vite

Frontend này là lớp demo cho lab research agent.
Mục tiêu chính:

- chọn provider / version;
- nhập prompt và chạy chat;
- xem trace tool theo từng round;
- xem run JSON / transcript / version log;
- hỗ trợ so sánh v0 → v3 trên cùng một scenario.

Đây là scaffold ban đầu. Khi triển khai thật, frontend sẽ gọi lại backend hiện có (`chat.py`, `run_eval.py` hoặc một API wrapper) thay vì tự dựng agent loop mới.

