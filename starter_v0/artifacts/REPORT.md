# Day 04 Lab v2 Report — Multi-Source Robotics Research Agent

> Báo cáo được tổng hợp từ code, run JSON, transcript và commit hiện có trong repository.
>
> **Lưu ý trước khi nộp:** `data/eval_group.json` hiện có **20 case**, trong khi rubric yêu cầu **đúng 10 case: 5 single-turn + 5 multi-turn**. Repo đã có run `20/20 PASS`, nhưng nhóm nên chốt lại đúng 10 case và chạy final group eval.

## Team

- **Team:** ARAMHONLOAN
- **Members**: - Lê Thị Hải Yến — 2A202601570 | Nguyễn Hải Anh — 2A202601670 | Nông Ngọc Dương — 2A202601296 |  Nguyễn Đức Anh — 2A202601870 | Tạ Hồng Quí — 2A202601538

- **Đề tài:** Multi-Source Robotics Research Assistant
- **Provider/model cho chuỗi v0–v3:** OpenAI / `gpt-4o-mini`
- **Provider/model cho run tích hợp mới nhất:** OpenRouter / `openai/gpt-4o-mini`
- **Frontend:** React + Vite
- **Backend:** FastAPI

---

# PHẦN A — Giới thiệu agent

## A1. Agent này làm được gì

**Robotics Research Agent** là trợ lý nghiên cứu đa nguồn chuyên về Robotics, Embodied AI, Computer Vision, hệ thống tự hành và các chủ đề AI liên quan.

Agent có thể tìm tin tức web, đọc URL, tìm bài đăng theo account hoặc chủ đề, tìm paper arXiv, đọc PDF arXiv, tra metadata paper qua DOI/Crossref, tra công ty Robotics, thông số robot, giá cổ phiếu, dịch nội dung, xuất báo cáo và hỏi lại khi thiếu dữ liệu.

### Link dùng thử

- **Frontend local:** `http://localhost:5173`
- **Backend local:** `http://localhost:8000`
- **Swagger Docs:** `http://localhost:8000/docs`
- **Health check:** `GET http://localhost:8000/health`
- **Main endpoint:** `POST http://localhost:8000/chat`
- **Public URL:** Chưa có trong repository.

## A2. Tool agent có

| Tên tool | Làm được gì | Phân loại |
|---|---|---|
| `clarify` | Hỏi lại khi thiếu dữ liệu hoặc cần xác nhận | Core built-in |
| `timeline` | Lấy post gần đây của một tài khoản cụ thể | Core built-in |
| `social_search` | Tìm post theo từ khóa/chủ đề | Core built-in |
| `lookup` | Tìm web và tin tức theo timeframe | Core built-in |
| `fetch` | Đọc một URL cụ thể | Core built-in |
| `format` | Tạo digest Markdown từ dữ liệu đã có | Core built-in |
| `send` | Gửi Telegram sau xác nhận | Optional built-in |
| `policy` | Tra policy nội bộ | Optional built-in |
| `papers` | Tìm paper trên arXiv | Optional built-in |
| `paper_text` | Trích text PDF arXiv | Optional built-in |
| `robotics_companies` | Tra cứu công ty Robotics theo tên hoặc loại robot | Tool mới của nhóm |
| `robot_specs` | Tra thông số kỹ thuật robot | Tool mới của nhóm |
| `robotics_paper_lookup` | Tra metadata paper qua Crossref bằng DOI/title/author/keyword | Tool mới của nhóm |
| `stock_quote` | Tra thông tin tài chính theo ticker | Tool mới; mock API |
| `translate` | Dịch nội dung | Tool mới; local transform |
| `export_report` | Xuất báo cáo Markdown/text | Tool mới; có side effect |

### Phân ranh tool Robotics

```text
Tin Robotics mới              → lookup
Post của account cụ thể       → timeline
Thảo luận social theo topic   → social_search
URL cụ thể                    → fetch
Paper arXiv                   → papers
Đọc PDF arXiv                 → paper_text
DOI / metadata xuất bản       → robotics_paper_lookup
Công ty Robotics              → robotics_companies
Thông số robot                → robot_specs
```

## A3. Câu hỏi mẫu để thử

1. `Tin tức robotics tuần này có gì nổi bật?`
2. `Những công ty nào đang làm humanoid robot?`
3. `Thông số kỹ thuật của robot Atlas là gì?`
4. `Tra metadata paper có DOI 10.15607/RSS.2025.XXI.017.`
5. `Tìm 3 paper về Vision-Language-Action trong robot manipulation.`

## A4. Kịch bản demo đã rehearse

| Scenario | Tool trace cần thấy | Câu chuyện cải thiện version | Evidence |
|---|---|---|---|
| Tin Robotics hôm nay | `lookup(query="robot news", topic="news", timeframe="day")` | v3 chọn đúng tool và timeframe | `transcripts/v3_session_kgtb83_20260729T162624.transcript.json` |
| Thiếu account Twitter | `clarify(response_type="text")` | v0 tự đoán; v3 bắt buộc hỏi lại | `runs/v3_B_base_openai_20260729T152223680602.json` |
| Xác nhận external action | `clarify(response_type="yes_no")` hoặc `send(confirmed=true)` sau xác nhận | v3 sửa confirmation boundary | `runs/v3_B_base_openai_20260729T152223680602.json` |
| Công ty humanoid | `robotics_companies(robot_type="humanoid")` | Dùng dữ liệu local thay web search mơ hồ | Group eval |
| Specs Atlas | `robot_specs(robot_name="Atlas")` | Trả dữ liệu có cấu trúc | Group eval |
| Tra DOI paper | `robotics_paper_lookup(lookup_type="doi")` | Bổ sung metadata học thuật ngoài arXiv | `runs/v3-robotics-tool_B_base_openai_20260729T153859424112.json` |

---

# PHẦN B — Chi tiết / Bằng chứng

> Metric hợp lệ khi `provider_error_cases = 0` và `measured_cases = total_cases`. Routing PASS không chứng minh tool execution đã thành công; `tool_results` có error phải review thủ công.

## B1. Version evidence

| Version | Prompt/tool change | Hypothesis | Case accuracy | Routing | Args | Multi-turn | Run file |
|---|---|---|---:|---:|---:|---:|---|
| `v0` | Baseline | Đo hành vi ban đầu | 0.65 | 0.75 | 0.65 | 1.00 | `runs/v0_B_base_openai_20260729T150536267300.json` |
| `v1` | Sửa `system_prompt.md` | Policy rõ hơn giảm wrong-tool và out-of-scope | 0.80 | 0.85 | 0.80 | 0.8333 | `runs/v1_B_base_openai_20260729T151120622341.json` |
| `v2` | Sửa `tools.yaml` | Boundary và negative routing rõ hơn giảm sai tool/args | 0.90 | 0.95 | 0.90 | 1.00 | `runs/v2_B_base_openai_20260729T151833874673.json` |
| `v3` | Sửa missing-account và confirmation rule | Mandatory override sửa hai lỗi cuối | **1.00** | **1.00** | **1.00** | **1.00** | `runs/v3_B_base_openai_20260729T152223680602.json` |

### Artifact versions

```text
v0: v0+pf0c107a9d7a1+t011c271ef0bb
v1: v1+pd2439d839819+t011c271ef0bb
v2: v2+pd2439d839819+t1164d588384c
v3: v3+pcb9a9288bf5f+t1164d588384c
```

### Regression sau khi thêm `robotics_paper_lookup`

```text
Run: runs/v3-robotics-tool_B_base_openai_20260729T153859424112.json
total_cases: 20
measured_cases: 20
provider_error_cases: 0
passed_cases: 20
case_accuracy: 1.0
tool_routing_accuracy: 1.0
argument_accuracy: 1.0
multiturn_accuracy: 1.0
```

### Run tích hợp mới nhất

```text
Base:  runs/v3_B_base_openrouter_20260729T155142098566.json  → 20/20 PASS
Group: runs/v3_B_group_openrouter_20260729T155919120958.json → 20/20 PASS
```

## B2. Failure analysis

| Case ID | Failure type | What failed | Fix |
|---|---|---|---|
| `R03_web_news_routing` | wrong tool/args | Không map “hôm nay” sang news/day | Thêm current-news routing trong v1 |
| `R08_out_of_scope` | out of scope | Gọi tool cho bài ngoài phạm vi | Thêm no-tool policy trong v1 |
| `R10_missing_handle` | missing info | Tự đoán account hoặc đổi thành topic search | v3 bắt buộc `clarify(text)` |
| `R11_missing_url` | missing info | Tạo placeholder URL | v2 cấm fabricate URL |
| `R12_confirm_before_send` | wrong boundary | Dùng `clarify(text)` thay `yes_no` | v3 thêm confirmation rule |
| `R13_parallel_web_and_tweets` | wrong tool | Chỉ gọi một source | v1 cho phép multi-source |
| `R14_out_of_scope_coding` | out of scope | Gọi tool cho coding task | Thêm research-scope boundary |
| `M06_switch_tool` | wrong tool | Giữ social sau khi user chuyển sang web | v2 thêm latest-instruction precedence |

## B3. Team eval cases

### 10 case Robotics chính

| Case ID | What it tests | Expected | Result |
|---|---|---|---|
| `G01_robotics_news_week` | Tin Robotics tuần này | `lookup(topic=news,timeframe=week)` | PASS |
| `G02_company_humanoid` | Công ty humanoid | `robotics_companies(robot_type=humanoid)` | PASS |
| `G03_atlas_specs` | Specs Atlas | `robot_specs(robot_name=Atlas)` | PASS |
| `G04_doi_metadata_routing` | DOI metadata | `robotics_paper_lookup(lookup_type=doi)` | PASS |
| `G05_out_of_scope_math` | Ngoài scope | `no_tool` | PASS |
| `M01_missing_handle_then_fill` | Bổ sung handle | `timeline(screenname=BostonDynamics,limit=5)` | PASS |
| `M02_carryover_timeframe_robotics` | Carry timeframe | `lookup(query=drone,topic=news,timeframe=day)` | PASS |
| `M03_correction_robot_name` | Spot → Atlas | `robot_specs(robot_name=Atlas,spec_category=mobility)` | PASS |
| `M04_switch_tool_twitter_to_web` | Social → web | `lookup(query=Unitree robot,topic=news)` | PASS |
| `M05_confirm_before_send` | Gửi sau xác nhận | `send(confirmed=true)` | PASS |

### 10 case integration bổ sung hiện có

`G06`–`G10` và `GM01`–`GM05` kiểm tra `stock_quote`, `export_report`, `translate`, missing stock symbol, out-of-scope creative writing và multi-turn confirmation. Run mới nhất ghi nhận toàn bộ PASS.

## B4. Live chat evidence

| Scenario | Tool calls | Transcript | Outcome |
|---|---|---|---|
| `hello` | Không gọi tool | `transcripts/v3_session_kgtb83_20260729T162504.transcript.json` | Trả lời trực tiếp |
| `Cho tôi công thức nấu gà rán` | Không gọi tool | `transcripts/v3_session_kgtb83_20260729T162544.transcript.json` | Từ chối ngoài phạm vi |
| `Cho tôi thông tin về báo robot mới nhất` | `lookup(query="robot news",topic="news",timeframe="day")` | `transcripts/v3_session_kgtb83_20260729T162624.transcript.json` | Trả tin Robotics mới |

## B5. Tool capability evidence

| Category | Evidence | What worked | Risk / Guardrail |
|---|---|---|---|
| `robotics_companies` | `tools/robotics_companies/` | Local database, lọc theo robot type | Dữ liệu tĩnh |
| `robot_specs` | `tools/robot_specs/` | Specs theo model/category | Có thể lỗi thời |
| `robotics_paper_lookup` | `tools/robotics_paper_lookup/` | DOI/keyword lookup qua Crossref | Phụ thuộc mạng và chất lượng metadata |
| `stock_quote` | `tools/stock_quote/` | Output tài chính có cấu trúc | Hiện là mock API |
| `translate` | `tools/translate/` | Dịch local | Chất lượng phụ thuộc implementation |
| `export_report` | `tools/export_report/` | Xuất Markdown/text | Side effect; cần sanitize filename |
| Registry | `tools/__init__.py` | 16 tool được đăng ký | Phải đồng bộ tên với YAML/eval |
| Base regression | `runs/v3_B_base_openrouter_20260729T155142098566.json` | 20/20 PASS | Review execution errors thủ công |
| Group integration | `runs/v3_B_group_openrouter_20260729T155919120958.json` | 20/20 PASS | Chưa đúng “exactly 10 cases” |

### Evidence `robotics_paper_lookup`

```text
DOI test: 10.1038/s41586-023-06004-9
Title: Faster sorting algorithms discovered using deep reinforcement learning
Year: 2023
Venue: Nature
```

```text
Keyword: vision language action robotics
Result: Fine-Tuning Vision-Language-Action Models: Optimizing Speed and Success
Authors: Moo Kim, Chelsea Finn, Percy Liang
Year: 2025
Venue: Robotics: Science and Systems XXI
DOI: 10.15607/RSS.2025.XXI.017
```

Input rỗng trả structured error `missing_query` thay vì crash.

## B6. Reflection

### Fix thuộc `system_prompt.md`

- no-tool/out-of-scope;
- không đoán account, URL hoặc DOI;
- multi-source calls;
- latest instruction override;
- clarification khi thiếu account;
- confirmation trước send/export;
- routing theo domain Robotics.

### Fix thuộc `tools.yaml`

- when-to-use/when-not-to-use;
- boundary giữa timeline/social, lookup/fetch, Crossref/arXiv;
- schema, enum, default, giới hạn args;
- negative routing và confirmation contract.

### Failure cần manual review

- Tool routing PASS nhưng API thật có thể lỗi vì thiếu `RAPIDAPI_KEY`, `TAVILY_API_KEY` hoặc `FIRECRAWL_API_KEY`.
- Crossref có thể trả item ít liên quan dù routing đúng.
- `stock_quote` là mock, không phải giá realtime.

### Cải tiến tiếp theo

1. Thu gọn `eval_group.json` về đúng 10 case và chạy lại.
2. Đồng bộ `version_log.csv` với run thực tế.
3. Thêm public URL.
4. Thêm transcript cho DOI/spec/company/send/export.
5. Thêm test timeout, 404, 429 và malformed JSON cho Crossref.
6. Thêm cache/retry/backoff.
7. Không hard-code metrics cũ trong frontend.
8. Giới hạn CORS production.

---

# KẾT LUẬN

```text
Case accuracy:          0.65 → 1.00
Tool routing accuracy:  0.75 → 1.00
Argument accuracy:      0.65 → 1.00
Multi-turn accuracy:    1.00 → 1.00
```

Base regression sau khi thêm tool mới vẫn đạt `20/20 PASS`. Run tích hợp mới nhất cũng đạt `20/20 PASS` trên base và group integration. Việc còn lại trước final submission là đưa `data/eval_group.json` về đúng 10 case theo rubric và cập nhật report bằng run cuối.
