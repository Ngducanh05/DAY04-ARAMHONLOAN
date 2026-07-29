---
name: robot_specs
track: core
kind: local_knowledge
requires_env: []
inputs: [robot_name, spec_category]
outputs: [robot, specs]
side_effect: false
---
# robot_specs

Tra cứu thông số kỹ thuật chi tiết của các mẫu robot nổi tiếng từ database nội bộ.
Hỗ trợ lọc theo danh mục: physical, mobility, sensors, power, software.
Không cần API key — dữ liệu local.

## Ví dụ sử dụng
- `robot_specs(robot_name="Atlas")` → thông số đầy đủ của Atlas
- `robot_specs(robot_name="Spot", spec_category="mobility")` → tốc độ, leo dốc...
- `robot_specs(robot_name="Optimus", spec_category="physical")` → chiều cao, cân nặng...
