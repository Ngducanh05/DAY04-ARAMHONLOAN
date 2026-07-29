# Day 04 Lab v2 Report — Robotics Research Agent

## Team

- Team: Robotics AI Group
- Members: Core Team
- Provider/model: OpenRouter (`openai/gpt-4o-mini`)

---

# PHẦN A — Giới thiệu agent

## A1. Agent này làm được gì

**Robotics Research Agent** là trợ lý thông minh chuyên nghiên cứu, tra cứu tin tức thời sự, đọc bài viết, tìm kiếm bài báo khoa học (arXiv/Crossref), tra cứu thông tin công ty robotics, thông số kỹ thuật các mẫu robot nổi tiếng (Atlas, Spot, Optimus, H1...), tra cứu giá cổ phiếu, xuất báo cáo và dịch thuật tự động.

**Link API Backend (sử dụng trong showdown/demo):**

> Backend chạy FastAPI tại port 8000 (cho phép bất kỳ Frontend nào gọi REST API).
> 
> Base URL: `http://localhost:8000`
> 
> Swagger Docs: `http://localhost:8000/docs`
> 
> Main Endpoint: `POST http://localhost:8000/chat`
> 
> Health Check: `GET http://localhost:8000/health`

---

## A2. Tool agent có

| Tên tool | Làm được gì | Tool mới nhóm thêm? |
|---|---|---|
| clarify | Hỏi lại người dùng khi thiếu thông tin hoặc xin xác nhận trước hành động gửi tin | Không (Core) |
| lookup | Tìm kiếm tin tức và thông tin tổng quan trên Web qua Tavily | Không (Core) |
| fetch | Đọc nội dung chi tiết của một URL | Không (Core) |
| timeline | Lấy các tweet/post gần đây của 1 tài khoản Twitter cụ thể | Không (Core) |
| social_search | Tìm kiếm tweet theo từ khóa/chủ đề trên Twitter | Không (Core) |
| papers | Tìm bài báo khoa học trên arXiv về robotics, SLAM, motion planning | Không (Core) |
| paper_text | Tải PDF arXiv và trích xuất nội dung văn bản | Không (Core) |
| format | Trình bày danh sách dữ liệu thu thập thành digest/newsletter Markdown | Không (Core) |
| send | Gửi bản tin lên Telegram channel (cần xác nhận trước) | Không (Core) |
| policy | Tra cứu quy định/chính sách nội bộ công ty | Không (Core) |
| **robotics_companies** | **Tra cứu thông tin 16+ công ty robotics nổi tiếng (lọc theo loại robot)** | **CÓ (Tool mới #1)** |
| **robot_specs** | **Tra cứu thông số kỹ thuật chi tiết của 8 mẫu robot (Atlas, Spot, Optimus...)** | **CÓ (Tool mới #2)** |
| **robotics_paper_lookup** | **Tra cứu metadata bài báo khoa học học thuật (tác giả, doi, venue, trích dẫn) qua Crossref** | **CÓ (Tool mới #3)** |
| **stock_quote** | **Tra cứu giá cổ phiếu, thông tin tài chính theo mã chứng khoán (NVDA, AAPL, FPT...)** | **CÓ (Tool mới #4)** |
| **export_report** | **Xuất bản báo cáo nghiên cứu/bản tin digest ra file báo cáo cục bộ (.md/.txt)** | **CÓ (Tool mới #5)** |
| **translate** | **Dịch nội dung hoặc bài viết digest sang ngôn ngữ chỉ định (Vietnamese, English...)** | **CÓ (Tool mới #6)** |

---

## A3. Câu hỏi mẫu để thử

1. *"Tin tức robotics tuần này có gì mới nổi bật?"*
2. *"Những công ty nào đang chế tạo humanoid robot nổi tiếng?"*
3. *"Thông số kỹ thuật và tốc độ tối đa của robot Atlas là bao nhiêu?"*
4. *"Cho mình xem thông tin học thuật bài báo DOI 10.1109/LRA.2023.1234567."*
5. *"Giá cổ phiếu NVIDIA (NVDA) hôm nay là bao nhiêu?"*
6. *"Xuất báo cáo nghiên cứu này ra file markdown với tiêu đề 'Báo cáo AI 2026'."*

---

## A4. Kịch bản demo đã rehearse

| Scenario | Tool trace cần thấy | Câu chuyện cải thiện version | Run / Evidence File |
|---|---|---|---|
| 1. Hỏi tin robotics tuần này | `lookup(query="robotics", topic="news", timeframe="week")` | v0 đoán bừa/không truyền timeframe → v3 truyền đúng timeframe=week | `runs/v3_B_base_openrouter_20260729T172317709048.json` |
| 2. Tra cứu công ty humanoid | `robotics_companies(robot_type="humanoid")` | v0 không có tool → v3 gọi tool mới `robotics_companies` trả về 5 công ty | `starter_v0/server.py` |
| 3. Tra cứu specs robot Atlas | `robot_specs(robot_name="Atlas")` | v0 tìm web mơ hồ → v3 gọi tool mới `robot_specs` trả về chiều cao, cân nặng, tốc độ | `starter_v0/server.py` |
| 4. Tra cứu DOI học thuật | `robotics_paper_lookup(query="10.1109/...", lookup_type="doi")` | v0 không hỗ trợ DOI → v3 dùng Crossref API trả về authors/venue/citation | `runs/v3_B_group_openrouter_20260729T172559513163.json` |
| 5. Thiếu handle Twitter | `clarify(response_type="text")` | v0 đoán bừa tài khoản → v3 dừng lại hỏi user cần lấy tweet của ai | `runs/v3_B_base_openrouter_20260729T172317709048.json` |

---

# PHẦN B — Chi tiết / Bằng chứng

## B1. Version evidence

| Version | Prompt/tool change | Hypothesis | Metric name | Baseline | Result | Run File |
|---|---|---|---|---:|---:|---|
| v0 | Baseline starter code | Chạy thử nghiệm ban đầu | case_accuracy | — | 0.35 | `runs/v0_B_base_openai_20260729T150536267300.json` |
| v1 | `system_prompt.md` | Sửa các lỗi cố ý (hỏi lại khi thiếu, xác nhận trước khi gửi, từ chối ngoài scope) | case_accuracy | 0.35 | 0.75 | `runs/v1_B_base_openai_20260729T151120622341.json` |
| v2 | `tools.yaml` | Tinh chỉnh mô tả từng tool + thêm tool `robotics_companies` | case_accuracy | 0.75 | 0.85 | `runs/v2_B_base_openai_20260729T151833874673.json` |
| **v3** | `system_prompt.md` + `tools.yaml` + 6 Custom Tools | Tối ưu robotics domain rules, map handles, tuân thủ số lượng người dùng yêu cầu, tích hợp 16 tools | case_accuracy | 0.85 | **1.00 (100%)** | `runs/v3_B_base_openrouter_20260729T172317709048.json` |

---

**Chỉ số v3 đạt được trên cả 2 bộ test case:**

### 1. Bộ `eval_base.json` (20 test cases chuẩn BTC)
- `case_accuracy`: **100%** (20/20 cases PASS)
- `tool_routing_accuracy`: **100%** (20/20 PASS)
- `argument_accuracy`: **100%** (20/20 PASS)
- `multiturn_accuracy`: **100%** (6/6 multi-turn cases PASS)
- `provider_error_cases`: **0**
- File log bằng chứng: `runs/v3_B_base_openrouter_20260729T172317709048.json`

### 2. Bộ `eval_group.json` (20 test cases mở rộng của Nhóm)
- `case_accuracy`: **100%** (20/20 cases PASS)
- `tool_routing_accuracy`: **100%** (20/20 PASS)
- `argument_accuracy`: **100%** (20/20 PASS)
- `multiturn_accuracy`: **100%** (5/5 multi-turn cases PASS)
- `provider_error_cases`: **0**
- File log bằng chứng: `runs/v3_B_group_openrouter_20260729T172559513163.json`

---

## B2. Failure analysis & Solutions

| Case ID | Failure Type Ban Đầu | Nguyên Nhân | Giải Pháp Khắc Phục | Kết Quả Hiện Tại |
|---|---|---|---|---|
| R10 | missing_tool_call | Khi user xin tweet mà thiếu handle, model tự ý fallback sang `lookup` tin tức thay vì dừng lại hỏi | Siết chặt quy tắc trong `system_prompt.md`: Hễ thấy yêu cầu tweet mà thiếu handle, BẮT BUỘC gọi `clarify(response_type="text")`. | **PASS (100%)** |
| R12 | wrong_boundary | Model gọi `clarify(response_type="text")` để xin lại nội dung thay vì xin xác nhận | Thêm quy tắc cụ thể trong prompt: Mọi yêu cầu gửi/đăng bài lên Telegram chưa có xác nhận BẮT BUỘC gọi `clarify(response_type="yes_no")`. | **PASS (100%)** |
| M05 | wrong_boundary | Khi user đã nói "Xác nhận gửi luôn nhé", model gọi lại `lookup` hoặc hỏi thêm lần nữa | Cập nhật quy tắc confirmation: Nếu người dùng đã nói từ khóa xác nhận ("Xác nhận", "Đồng ý", "Gửi đi"), tiến hành gọi thẳng `send(confirmed=True)`. | **PASS (100%)** |
| User UI | UI Formatting & Quantity | 1) Các mục danh sách đều bị lặp lại chỉ số `1.`; 2) User xin 1 kết quả nhưng model trả về nhiều hơn | 1) Sửa component `FormattedMarkdown` hiển thị chính xác chỉ số `1.`, `2.`, `3.`; 2) Thêm rule chỉ thị model truyền đúng `max_results=1` và trình bày đúng 1 kết quả. | **PASS (100%)** |

---

## B3. Team eval cases (Bộ test `eval_group.json` — 20 cases)

| Case ID | What It Tests | Expected Tool / Behavior | Result |
|---|---|---|---|
| G01 | Single-turn: tin robotics tuần này | `lookup(topic="news", timeframe="week")` | **PASS** |
| G02 | Single-turn: công ty humanoid robot | `robotics_companies(robot_type="humanoid")` | **PASS** |
| G03 | Single-turn: thông số robot Atlas | `robot_specs(robot_name="Atlas")` | **PASS** |
| G04 | Single-turn: tra cứu DOI bài báo học thuật | `robotics_paper_lookup(query="10.1109/...", lookup_type="doi")` | **PASS** |
| G05 | Single-turn: giải toán ngoài scope | `no_tool` (từ chối lịch sự) | **PASS** |
| G06 | Single-turn: giá cổ phiếu NVIDIA | `stock_quote(symbol="NVDA")` | **PASS** |
| G07 | Single-turn: xuất báo cáo markdown | `export_report(title="...", file_format="markdown")` | **PASS** |
| G08 | Single-turn: dịch thuật tiếng Việt | `translate(target_language="Vietnamese")` | **PASS** |
| G09 | Single-turn: thiếu mã cổ phiếu | `clarify(response_type="text")` | **PASS** |
| G10 | Single-turn: sáng tác thơ ngoài scope | `no_tool` (từ chối lịch sự) | **PASS** |
| M01 | Multi-turn: thiếu handle → bổ sung Boston Dynamics | `timeline(screenname="BostonDynamics", limit=5)` | **PASS** |
| M02 | Multi-turn: carryover timeframe=day từ lượt 1 | `lookup(query="drone", topic="news", timeframe="day")` | **PASS** |
| M03 | Multi-turn: sửa robot từ Spot → Atlas | `robot_specs(robot_name="Atlas", spec_category="mobility")` | **PASS** |
| M04 | Multi-turn: đổi từ Twitter sang Web | `lookup(query="Unitree robot", topic="news")` | **PASS** |
| M05 | Multi-turn: xin xác nhận trước khi gửi Telegram | `send(confirmed=true)` | **PASS** |
| GM01 | Multi-turn: thiếu symbol → bổ sung FPT | `stock_quote(symbol="FPT")` | **PASS** |
| GM02 | Multi-turn: hỏi tin tức → lượt 2 dịch tin | `translate(target_language="Vietnamese")` | **PASS** |
| GM03 | Multi-turn: xác nhận xuất báo cáo | `export_report(title="AI Digest Today", file_format="markdown")` | **PASS** |
| GM04 | Multi-turn: tìm web Gemini 2.0 | `lookup(query="Gemini 2.0")` | **PASS** |
| GM05 | Multi-turn: xác nhận gửi tin Telegram | `send(confirmed=true)` | **PASS** |

---

## B4. Live chat evidence

Thực hiện qua FastAPI REST API `POST http://localhost:8000/chat` & React Frontend UI:

| Scenario / Prompt | Version | Tool Calls + Args | Outcome |
|---|---|---|---|
| *"Những công ty nào đang phát triển robot humanoid?"* | v3 | `robotics_companies(robot_type="humanoid")` | Trả về danh sách 5 công ty hàng đầu (Boston Dynamics, Figure AI, Agility Robotics, Unitree, 1X) kèm mô tả sản phẩm. |
| *"Thông số kỹ thuật của robot Atlas là bao nhiêu?"* | v3 | `robot_specs(robot_name="Atlas")` | Trả về thông số chiều cao (1.5m), cân nặng (89kg), nguồn điện thuỷ lực/điện, tốc độ và các cảm biến. |
| *"Cho mình xem thông tin học thuật bài báo DOI 10.1109/LRA.2023.1234567"* | v3 | `robotics_paper_lookup(query="10.1109/...", lookup_type="doi")` | Trả về tác giả, tạp chí (venue), năm xuất bản và số lượt trích dẫn từ Crossref. |
| *"Giá cổ phiếu NVIDIA (NVDA) hôm nay là bao nhiêu?"* | v3 | `stock_quote(symbol="NVDA")` | Trả về giá cổ phiếu NVDA, biến động 24h và thông tin tài chính liên quan. |

---

## B5. Tool capability evidence

| Category | Evidence File | What Worked | Guardrail & Benefits |
|---|---|---|---|
| Tool mới #1 | `starter_v0/tools/robotics_companies/tool.py` | Lọc 16+ công ty robotics theo loại robot | Dữ liệu local chuẩn xác, không tiêu tốn API key |
| Tool mới #2 | `starter_v0/tools/robot_specs/tool.py` | Trả về thông số kỹ thuật chi tiết của 8 robot nổi tiếng | Dữ liệu local, tìm kiếm fuzzy match tên robot |
| Tool mới #3 | `starter_v0/tools/robotics_paper_lookup/tool.py` | Tra cứu thông tin học thuật qua DOI / Crossref API | Hỗ trợ DOI/DOI URL, kiểm tra lỗi 404 chuẩn hóa |
| Tool mới #4 | `starter_v0/tools/stock_quote/tool.py` | Tra cứu giá cổ phiếu & dữ liệu tài chính | Trả về dữ liệu chứng khoán dạng JSON chuẩn |
| Tool mới #5 | `starter_v0/tools/export_report/tool.py` | Xuất bản báo cáo ra file `.md` / `.txt` cục bộ | Lưu file tự động vào thư mục `exports/` |
| Tool mới #6 | `starter_v0/tools/translate/tool.py` | Dịch nội dung bài viết sang ngôn ngữ chỉ định | Hỗ trợ đa ngôn ngữ (Vietnamese, English...) |

---

## B6. Reflection & Lessons Learned

- **Fixes thuộc về `system_prompt.md`:**
  - Quy tắc bắt buộc gọi `clarify` khi thiếu handle/URL hoặc xin xác nhận side-effects.
  - Quy tắc từ chối lịch sự với các câu hỏi ngoài phạm vi (giải toán, sáng tác thơ, viết code).
  - Quy tắc map tên riêng sang handle (`Boston Dynamics` → `BostonDynamics`, `Elon Musk` → `elonmusk`).
  - Quy tắc tuân thủ đúng số lượng người dùng chỉ định (`max_results=1`).

- **Fixes thuộc về `tools.yaml`:**
  - Viết mô tả `description` rõ ràng, chỉ rõ khi nào NÊN DÙNG và KHÔNG NÊN DÙNG từng tool.
  - Đăng ký đầy đủ tham số và kiểu dữ liệu chuẩn OpenAPI schema cho cả 16 tools.

- **Kinh nghiệm rút ra:**
  - Việc đánh giá bằng dữ liệu thực nghiệm (evidence-driven evaluation) giúp nhóm phát hiện đúng điểm nghẽn và cải thiện chính xác prompt/tool declarations để đưa độ chính xác từ **35% lên 100%**.
  - Việc phân tách rõ ràng Backend (FastAPI REST Server) và Frontend (React + Vite UI với streaming & markdown renderer) giúp ứng dụng hoạt động mượt mà, chuyên nghiệp và sẵn sàng cho các kịch bản demo thực tế.
