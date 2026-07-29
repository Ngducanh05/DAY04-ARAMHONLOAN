# Day 04 Lab v2 Report — Robotics Research Agent

## Team

- Team: Robotics AI Group
- Members: Core Team
- Provider/model: OpenRouter (`openai/gpt-4o-mini`)

---

# PHẦN A — Giới thiệu agent

## A1. Agent này làm được gì

**Robotics Research Agent** là trợ lý thông minh chuyên nghiên cứu, tra cứu tin tức thời sự, đọc bài viết, tìm kiếm bài báo khoa học (arXiv), tra cứu thông tin công tỷ robotics và thông số kỹ thuật các mẫu robot nổi tiếng (Atlas, Spot, Optimus, H1...).

**Link API Backend (sử dụng trong showdown/demo):**

> Backend chạy FastAPI tại port 8000 (cho phép bất kỳ Frontend nào gọi REST API).
> 
> Base URL: `http://localhost:8000`
>
> Swagger Docs: `http://localhost:8000/docs`
>
> Main Endpoint: `POST http://localhost:8000/chat`

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
| **robot_specs** | **Tra cứu thông số kỹ thuật chi tiết của 8 mẫu robot (Atlas, Spot, Optimus...)** | **CÓ (Tool mới #2 - Bonus)** |

## A3. Câu hỏi mẫu để thử

1. *"Tin tức robotics tuần này có gì mới nổi bật?"*
2. *"Những công ty nào đang chế tạo humanoid robot nổi tiếng?"*
3. *"Thông số kỹ thuật và tốc độ tối đa của robot Atlas là bao nhiêu?"*
4. *"Xem giúp mình các bài đăng mới nhất của @BostonDynamics trên Twitter."*
5. *"Tìm các bài báo khoa học arXiv mới về chủ đề humanoid locomotion."*

## A4. Kịch bản demo đã rehearse

| Scenario | Tool trace cần thấy | Câu chuyện cải thiện version | Fallback run/transcript |
|---|---|---|---|
| 1. Hỏi tin robotics tuần này | `lookup(query="robotics", topic="news", timeframe="week")` | v0 đoán bừa/không truyền timeframe → v3 truyền đúng timeframe=week | `runs/v3_B_base_openrouter_*.json` |
| 2. Tra cứu công ty humanoid | `robotics_companies(robot_type="humanoid")` | v0 không có tool → v3 gọi tool mới `robotics_companies` trả về 5 công ty | `app.py` live test |
| 3. Tra cứu specs robot Atlas | `robot_specs(robot_name="Atlas")` | v0 tìm web mơ hồ → v3 gọi tool mới `robot_specs` trả về chiều cao, cân nặng, tốc độ | `app.py` live test |
| 4. Thiếu handle Twitter | `clarify(response_type="text")` | v0 đoán bừa tài khoản → v3 dừng lại hỏi user cần lấy tweet của ai | `runs/v3_B_base_openrouter_*.json` |

---

# PHẦN B — Chi tiết / Bằng chứng

## B1. Version evidence

| Version | Prompt/tool change | Hypothesis | Metric name | Before | After | Run File |
|---|---|---|---|---:|---:|---|
| v0 | baseline | Chạy baseline starter code | case_accuracy | — | 0.35 | `runs/v0_B_base_openrouter.json` |
| v1 | `system_prompt.md` | Sửa 4 lỗi cố ý (hỏi lại khi thiếu, xác nhận trước khi gửi, từ chối ngoài scope) | case_accuracy | 0.35 | 0.75 | `runs/v1_B_base_openrouter.json` |
| v2 | `tools.yaml` | Viết mô tả chi tiết từng tool + thêm tool `robotics_companies` | case_accuracy | 0.75 | 0.85 | `runs/v2_B_base_openrouter.json` |
| v3 | `system_prompt.md` + `tools.yaml` | Tối ưu robotics domain rules + map handle + thêm `robot_specs` | case_accuracy | 0.85 | 0.90 | `runs/v3_B_base_openrouter_20260729T151625588143.json` |

**Chỉ số v3 đạt được trên bộ `base` eval suite:**
- `case_accuracy`: **90%** (18/20 cases PASS)
- `tool_routing_accuracy`: **95%**
- `multiturn_accuracy`: **100%** (6/6 multi-turn cases PASS)
- `provider_error_cases`: **0**

## B2. Failure analysis

| Case ID | Failure Type | Actual Tool Calls | What Failed | Fix |
|---|---|---|---|---|
| R03 | wrong_arg_value | `lookup(query="tin tức AI")` | LLM giữ cả cụm từ "tin tức AI" trong query thay vì rút gọn thành "AI" | Thêm rule trong prompt để rút gọn cụm từ tìm kiếm |
| R10 | missing_tool_call | `lookup(query="robotics")` | Khi user nói "tweet" mà thiếu handle, agent fallback sang tìm web thay vì hỏi lại | Siết chặt quy tắc: hễ thấy từ "tweet" mà thiếu handle là BẮT BUỘC gọi `clarify` |

## B3. Team eval cases

Danh sách 10 test case tự thiết kế trong `data/eval_group.json` (đạt 80% accuracy trên suite `group`):

| Case ID | What It Tests | Expected Tool/Behavior | Result |
|---|---|---|---|
| G01 | Single-turn: tin robotics tuần này | `lookup(topic="news", timeframe="week")` | PASS |
| G02 | Single-turn: công ty humanoid robot | `robotics_companies(robot_type="humanoid")` | PASS |
| G03 | Single-turn: thông số robot Atlas | `robot_specs(robot_name="Atlas")` | PASS |
| G04 | Single-turn: giải toán ngoài scope | `no_tool` (từ chối lịch sự) | PASS |
| G05 | Single-turn: gọi 2 tool song song (web + arXiv) | `lookup` + `papers` | FAIL (order) |
| M01 | Multi-turn: thiếu handle → bổ sung Boston Dynamics | `timeline(screenname="BostonDynamics", limit=5)` | PASS |
| M02 | Multi-turn: carryover timeframe=day từ lượt 1 | `lookup(query="drone", topic="news", timeframe="day")` | PASS |
| M03 | Multi-turn: sửa robot từ Spot → Atlas | `robot_specs(robot_name="Atlas", spec_category="mobility")` | PASS |
| M04 | Multi-turn: đổi từ Twitter sang Web | `lookup(query="Unitree robot", topic="news")` | PASS |
| M05 | Multi-turn: xin xác nhận trước khi gửi Telegram | `clarify(response_type="yes_no")` | FAIL (boundary) |

## B4. Live chat evidence

Thực hiện qua FastAPI endpoint `POST /chat`:

| Scenario/Turn | Version | Tool Calls + Args | Outcome |
|---|---|---|---|
| "Công ty nào làm humanoid?" | v3 | `robotics_companies(robot_type="humanoid", limit=5)` | Trả về thông tin 5 công ty (Boston Dynamics, Figure AI, Agility, Unitree, 1X) kèm link |
| "Thông số robot Spot" | v3 | `robot_specs(robot_name="Spot", spec_category="mobility")` | Trả về tốc độ (1.6 m/s), khả năng leo cầu thang, địa hình |

## B5. Tool capability evidence

| Category | Evidence File | What Worked | Risk / Guardrail |
|---|---|---|---|
| Must-have: tool mới #1 | `tools/robotics_companies/tool.py` | Lọc 16 công ty robotics theo loại robot | Dữ liệu local, không tốn API key |
| Bonus: tool mới #2 | `tools/robot_specs/tool.py` | Trả về thông số kỹ thuật 8 robot nổi tiếng | Dữ liệu local, tìm kiếm fuzzy match |

## B6. Reflection

- **Which fixes belonged in `system_prompt.md`?**
  - Quy tắc dừng lại hỏi `clarify` khi thiếu handle/URL.
  - Quy tắc từ chối các câu hỏi ngoài phạm vi (giải toán, lập trình).
  - Quy tắc map tên thường sang Twitter handle (`Boston Dynamics` → `BostonDynamics`).
- **Which fixes belonged in `tools.yaml`?**
  - Viết lại toàn bộ `description` cho từng tool thật rõ ràng và trực diện.
  - Nêu rõ khi nào DÙNG và khi nào KHÔNG ĐƯỢC DÙNG từng tool.
- **Which failure needed manual review instead of automatic grading?**
  - Case R03 (truyền `query="tin tức AI"` thay vì `query="AI"`): Về mặt thực tế, Tavily tìm `"tin tức AI"` vẫn trả về kết quả đúng, nhưng tự động chấm fail vì so sánh chuỗi chính xác.
- **What would you improve next?**
  - Thêm cache cho kết quả web search để tăng tốc độ phản hồi.
  - Bổ sung thêm API tra cứu GitHub repositories về ROS (Robot Operating System).
