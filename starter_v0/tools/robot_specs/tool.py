from __future__ import annotations

from typing import Any


ROBOT_SPECS_DB: dict[str, dict[str, Any]] = {
    "atlas": {
        "name": "Atlas",
        "manufacturer": "Boston Dynamics",
        "type": "Humanoid",
        "year": 2013,
        "latest_version": "Atlas (Electric, 2024)",
        "physical": {
            "height_cm": 150,
            "weight_kg": 89,
            "degrees_of_freedom": 28,
            "material": "Titanium, aluminum, 3D-printed polymer",
        },
        "mobility": {
            "max_speed_ms": 2.5,
            "jump_height_cm": 120,
            "can_backflip": True,
            "can_run": True,
            "terrain": "All terrain including rough outdoor, stairs, obstacles",
            "actuation": "Electric (2024 model); previously hydraulic",
        },
        "sensors": {
            "vision": "Stereo cameras, LIDAR, depth sensors",
            "imu": True,
            "force_torque": True,
        },
        "power": {
            "battery_wh": "Not publicly disclosed",
            "runtime_min": "~60 min (estimated)",
            "charging": "Plug-in electric",
        },
        "software": {
            "os": "Custom Boston Dynamics runtime",
            "programming": "Proprietary",
            "ai": "Reinforcement learning, whole-body control",
            "ros_support": False,
        },
        "use_cases": ["Research", "Search & Rescue", "Industrial inspection", "Manipulation"],
        "notable": "Can do parkour, backflips, gymnastics. 2024 model fully electric.",
        "url": "https://bostondynamics.com/atlas",
    },
    "spot": {
        "name": "Spot",
        "manufacturer": "Boston Dynamics",
        "type": "Quadruped",
        "year": 2019,
        "latest_version": "Spot Enterprise (2023)",
        "physical": {
            "height_cm": 62,
            "length_cm": 110,
            "weight_kg": 32.5,
            "payload_kg": 14,
            "degrees_of_freedom": 12,
            "material": "Aluminum, polymer",
        },
        "mobility": {
            "max_speed_ms": 1.6,
            "can_climb_stairs": True,
            "slope_max_deg": 30,
            "can_self_right": True,
            "terrain": "Rough terrain, stairs, slopes, indoor/outdoor",
            "actuation": "Electric servo",
        },
        "sensors": {
            "vision": "5 stereo cameras (360° obstacle avoidance)",
            "depth": True,
            "imu": True,
            "lidar": "Optional add-on",
            "arm_cameras": True,
        },
        "power": {
            "battery_wh": 605,
            "runtime_min": 90,
            "hot_swap": True,
            "charging": "Dock or cable",
        },
        "software": {
            "os": "Custom Spot runtime",
            "sdk": "Spot SDK (Python, C++, gRPC)",
            "ros_support": True,
            "autonomy": "Autonomous navigation, mission recording, GraphNav",
            "ai": "Computer vision, anomaly detection (add-on)",
        },
        "price_usd": 74500,
        "use_cases": ["Inspection", "Security", "Construction", "Research", "Entertainment"],
        "notable": "Most commercially successful quadruped. Used in ~100 countries.",
        "url": "https://bostondynamics.com/spot",
    },
    "optimus": {
        "name": "Optimus",
        "manufacturer": "Tesla",
        "type": "Humanoid",
        "year": 2022,
        "latest_version": "Optimus Gen 2 (2023)",
        "physical": {
            "height_cm": 173,
            "weight_kg": 57,
            "payload_kg": 20,
            "degrees_of_freedom": 28,
            "hands_dof": 11,
            "material": "Aluminum, actuators from Tesla",
        },
        "mobility": {
            "max_speed_ms": 0.83,
            "walk_speed_ms": 0.45,
            "can_run": False,
            "terrain": "Flat indoor/factory floors",
            "actuation": "Tesla-designed electric actuators",
        },
        "sensors": {
            "vision": "Cameras (FSD-style vision system)",
            "ai_chip": "Tesla FSD chip (D1)",
            "imu": True,
            "force_torque": True,
        },
        "power": {
            "battery_wh": 2300,
            "runtime_hours": 8,
            "charging": "Plug-in",
        },
        "software": {
            "os": "Custom Tesla OS",
            "ai": "Tesla FSD neural net, imitation learning",
            "ros_support": False,
            "training": "Video demonstrations from humans",
        },
        "target_price_usd": 20000,
        "use_cases": ["Tesla factory work", "General household tasks (future)"],
        "notable": "Elon Musk targets mass production. Gen 2 is 30% faster, 10kg lighter.",
        "url": "https://tesla.com/optimus",
    },
    "h1": {
        "name": "H1",
        "manufacturer": "Unitree Robotics",
        "type": "Humanoid",
        "year": 2023,
        "latest_version": "H1-2 (2024)",
        "physical": {
            "height_cm": 180,
            "weight_kg": 47,
            "payload_kg": 30,
            "degrees_of_freedom": 19,
            "material": "Aluminum alloy",
        },
        "mobility": {
            "max_speed_ms": 3.3,
            "can_run": True,
            "can_jump": True,
            "terrain": "Indoor/outdoor, moderate terrain",
            "actuation": "Unitree Electric actuators",
        },
        "sensors": {
            "vision": "Depth camera, LIDAR optional",
            "imu": True,
            "force_torque": True,
        },
        "power": {
            "battery_wh": 864,
            "runtime_min": 120,
            "charging": "Cable",
        },
        "software": {
            "os": "Unitree OS (ROS2-based)",
            "sdk": "Unitree SDK2",
            "ros_support": True,
            "ai": "RL-based locomotion",
        },
        "price_usd": 90000,
        "use_cases": ["Research", "Industrial", "Education"],
        "notable": "World's fastest humanoid at 3.3 m/s (as of 2024). Most affordable for specs.",
        "url": "https://unitree.com/h1",
    },
    "go2": {
        "name": "Go2",
        "manufacturer": "Unitree Robotics",
        "type": "Quadruped",
        "year": 2023,
        "latest_version": "Go2 EDU (2024)",
        "physical": {
            "height_cm": 40,
            "weight_kg": 15,
            "payload_kg": 8,
            "degrees_of_freedom": 12,
        },
        "mobility": {
            "max_speed_ms": 3.7,
            "can_climb_stairs": True,
            "can_run": True,
            "terrain": "Indoor/outdoor rough terrain",
            "actuation": "Unitree Electric servo",
        },
        "sensors": {
            "vision": "Depth camera, 4D LIDAR",
            "imu": True,
        },
        "power": {
            "battery_wh": 126,
            "runtime_min": 120,
        },
        "software": {
            "os": "Unitree OS",
            "ros_support": True,
            "sdk": "Unitree SDK2",
            "ai": "RL locomotion, obstacle avoidance",
        },
        "price_usd": 1600,
        "use_cases": ["Education", "Research", "Entertainment", "Light inspection"],
        "notable": "Most affordable capable quadruped. Popular in universities.",
        "url": "https://unitree.com/go2",
    },
    "digit": {
        "name": "Digit",
        "manufacturer": "Agility Robotics",
        "type": "Humanoid",
        "year": 2020,
        "latest_version": "Digit v4 (2023)",
        "physical": {
            "height_cm": 175,
            "weight_kg": 65,
            "payload_kg": 16,
            "degrees_of_freedom": 30,
        },
        "mobility": {
            "max_speed_ms": 1.5,
            "can_climb_stairs": True,
            "terrain": "Warehouse floors, ramps, outdoor",
            "actuation": "Electric",
        },
        "sensors": {
            "vision": "Intel RealSense depth cameras",
            "lidar": True,
            "imu": True,
        },
        "power": {
            "runtime_hours": 4,
            "charging": "Dock charging",
        },
        "software": {
            "os": "Custom Agility OS",
            "ai": "Deep RL locomotion, task learning",
            "ros_support": True,
        },
        "use_cases": ["Warehouse logistics", "Package handling", "Amazon facilities"],
        "notable": "Deployed in Amazon warehouses. World's first commercial humanoid deployment.",
        "url": "https://agilityrobotics.com/digit",
    },
    "figure01": {
        "name": "Figure 01",
        "manufacturer": "Figure AI",
        "type": "Humanoid",
        "year": 2023,
        "latest_version": "Figure 02 (2024)",
        "physical": {
            "height_cm": 167,
            "weight_kg": 60,
            "payload_kg": 20,
            "degrees_of_freedom": 43,
        },
        "mobility": {
            "max_speed_ms": 1.2,
            "terrain": "Factory floor, indoor",
            "actuation": "Electric",
        },
        "sensors": {
            "vision": "Camera array",
            "imu": True,
            "force_torque": True,
        },
        "power": {
            "runtime_hours": 5,
        },
        "software": {
            "ai": "OpenAI integration (Figure 02), end-to-end neural network",
            "training": "Teleoperation + imitation learning",
        },
        "use_cases": ["BMW factory", "Warehouse", "General manufacturing"],
        "notable": "Figure 02 integrates OpenAI multimodal AI for natural language task execution.",
        "url": "https://figure.ai",
    },
    "anymal": {
        "name": "ANYmal",
        "manufacturer": "ANYbotics",
        "type": "Quadruped",
        "year": 2016,
        "latest_version": "ANYmal D (2022)",
        "physical": {
            "weight_kg": 50,
            "payload_kg": 10,
            "ip_rating": "IP67 (dust/waterproof)",
        },
        "mobility": {
            "max_speed_ms": 1.0,
            "can_climb_stairs": True,
            "terrain": "Extreme terrain: oil rigs, underground mines, offshore platforms",
            "operating_temp_c": "-20 to 50",
        },
        "sensors": {
            "lidar": "Ouster OS1-64",
            "cameras": "5 wide-angle, 2 thermal (optional)",
            "gas_sensors": True,
            "pan_tilt_zoom": True,
        },
        "power": {
            "runtime_hours": 2,
            "hot_swap": True,
        },
        "software": {
            "os": "ANYmal OS (ROS-based)",
            "ros_support": True,
            "autonomy": "Fully autonomous inspection missions",
        },
        "use_cases": ["Oil & gas inspection", "Power plant", "Mining", "Construction"],
        "notable": "Only robot certified for Zone 1 ATEX hazardous area inspection.",
        "url": "https://anybotics.com/anymal",
    },
}


def get_robot_specs(
    robot_name: str = "",
    spec_category: str = "all",
) -> dict[str, Any]:
    try:
        spec_category = spec_category if spec_category in {
            "all", "physical", "mobility", "sensors", "power", "software"
        } else "all"

        # Fuzzy match robot name
        name_lower = robot_name.lower().strip()
        robot = None
        for key, data in ROBOT_SPECS_DB.items():
            if (
                key == name_lower
                or name_lower in key
                or name_lower in data["name"].lower()
                or (name_lower and key.startswith(name_lower[:3]))
            ):
                robot = data
                break

        if not robot:
            available = [d["name"] for d in ROBOT_SPECS_DB.values()]
            return {
                "tool": "robot_specs",
                "query": robot_name,
                "error": "not_found",
                "message": f"Robot '{robot_name}' not found in database.",
                "available_robots": available,
            }

        if spec_category == "all":
            specs = {k: v for k, v in robot.items() if k not in ("name", "manufacturer")}
        else:
            specs = robot.get(spec_category, {})

        summary_parts = [
            f"{robot['name']} by {robot['manufacturer']} ({robot['type']})",
            f"Year: {robot.get('year', 'N/A')}",
        ]
        if robot.get("physical", {}).get("height_cm"):
            summary_parts.append(f"Height: {robot['physical']['height_cm']}cm, Weight: {robot['physical'].get('weight_kg','?')}kg")
        if robot.get("mobility", {}).get("max_speed_ms"):
            summary_parts.append(f"Max speed: {robot['mobility']['max_speed_ms']} m/s")
        if robot.get("notable"):
            summary_parts.append(f"Notable: {robot['notable']}")

        return {
            "tool": "robot_specs",
            "query": robot_name,
            "spec_category": spec_category,
            "robot": robot["name"],
            "manufacturer": robot["manufacturer"],
            "type": robot["type"],
            "summary": " | ".join(summary_parts),
            "specs": specs,
            "url": robot.get("url", ""),
        }
    except Exception as exc:
        return {"tool": "robot_specs", "error": type(exc).__name__, "message": str(exc)}
