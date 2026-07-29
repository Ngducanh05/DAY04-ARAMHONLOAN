---
name: robotics_companies
track: core
kind: local_knowledge
requires_env: []
inputs: [query, robot_type, limit]
outputs: [items, total]
side_effect: false
---
# robotics_companies

Tra cứu thông tin về các công ty robotics hàng đầu thế giới từ database nội bộ.
Hỗ trợ lọc theo loại robot: humanoid, quadruped, arm, drone, logistics, mobile.
Không cần API key — dữ liệu local.

## Ví dụ sử dụng
- `robotics_companies(query="humanoid")` → danh sách công ty làm humanoid robot
- `robotics_companies(query="Boston Dynamics")` → thông tin cụ thể về Boston Dynamics
- `robotics_companies(robot_type="drone")` → công ty làm drone
