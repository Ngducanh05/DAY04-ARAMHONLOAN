from __future__ import annotations

from typing import Any


ROBOTICS_COMPANIES_DB: list[dict[str, Any]] = [
    {
        "name": "Boston Dynamics",
        "founded": 1992,
        "country": "USA",
        "headquarters": "Waltham, Massachusetts",
        "owner": "Hyundai Motor Group",
        "twitter": "@BostonDynamics",
        "website": "https://bostondynamics.com",
        "robot_types": ["humanoid", "quadruped", "logistics"],
        "robots": ["Atlas (humanoid)", "Spot (quadruped)", "Stretch (logistics)"],
        "focus": "Advanced dynamic robots for industrial and research use",
        "notable": "Pionner in dynamic locomotion and parkour robots. Atlas is world-famous humanoid.",
        "funding": "Acquired by Hyundai for $1.1B in 2021",
    },
    {
        "name": "Figure AI",
        "founded": 2022,
        "country": "USA",
        "headquarters": "Sunnyvale, California",
        "owner": "Independent (backed by OpenAI, Microsoft, NVIDIA, Amazon)",
        "twitter": "@figure_ai",
        "website": "https://figure.ai",
        "robot_types": ["humanoid"],
        "robots": ["Figure 01", "Figure 02"],
        "focus": "General-purpose humanoid robots for commercial deployment",
        "notable": "Partnership with BMW for factory deployment. Figure 02 integrated with OpenAI.",
        "funding": "$675M Series B at $2.6B valuation (2024)",
    },
    {
        "name": "Agility Robotics",
        "founded": 2015,
        "country": "USA",
        "headquarters": "Salem, Oregon",
        "owner": "Amazon (majority stake)",
        "twitter": "@AgilityRobotics",
        "website": "https://agilityrobotics.com",
        "robot_types": ["humanoid", "logistics"],
        "robots": ["Digit"],
        "focus": "Humanoid robots for warehouse and logistics automation",
        "notable": "Amazon DeepRobotics facility. Digit designed for last-mile logistics.",
        "funding": "Amazon acquisition in 2024",
    },
    {
        "name": "Unitree Robotics",
        "founded": 2016,
        "country": "China",
        "headquarters": "Hangzhou, Zhejiang",
        "owner": "Independent",
        "twitter": "@UnitreeRobotics",
        "website": "https://unitree.com",
        "robot_types": ["humanoid", "quadruped"],
        "robots": ["H1 (humanoid)", "H1-2 (humanoid)", "Go2 (quadruped)", "B2 (quadruped)", "G1 (humanoid)"],
        "focus": "Affordable high-performance quadruped and humanoid robots",
        "notable": "Most affordable humanoid robots on the market. H1 can run at 3.3 m/s.",
        "funding": "Private, estimated $1B+ valuation",
    },
    {
        "name": "1X Technologies (formerly Halodi Robotics)",
        "founded": 2014,
        "country": "Norway",
        "headquarters": "Moss, Norway / Sunnyvale, CA",
        "owner": "Independent (backed by OpenAI)",
        "twitter": "@1x_technologies",
        "website": "https://1x.tech",
        "robot_types": ["humanoid"],
        "robots": ["EVE (wheeled humanoid)", "NEO (bipedal humanoid)"],
        "focus": "Human-form robots for home and care environments",
        "notable": "OpenAI investment. NEO designed to work alongside humans at home.",
        "funding": "$100M Series B (2024)",
    },
    {
        "name": "Apptronik",
        "founded": 2016,
        "country": "USA",
        "headquarters": "Austin, Texas",
        "owner": "Independent (backed by Google)",
        "twitter": "@apptronik",
        "website": "https://apptronik.com",
        "robot_types": ["humanoid"],
        "robots": ["Apollo"],
        "focus": "Humanoid robots for industrial and logistics use cases",
        "notable": "NASA collaboration history. Google partnership for AI integration.",
        "funding": "$350M Series A (2024)",
    },
    {
        "name": "ANYbotics",
        "founded": 2016,
        "country": "Switzerland",
        "headquarters": "Zurich",
        "owner": "Independent",
        "twitter": "@ANYbotics",
        "website": "https://anybotics.com",
        "robot_types": ["quadruped"],
        "robots": ["ANYmal C", "ANYmal D"],
        "focus": "Inspection robots for oil & gas, utilities, and industrial sites",
        "notable": "Used in offshore oil platforms and power plants for automated inspection.",
        "funding": "$50M+ raised",
    },
    {
        "name": "Spot Robots (Clearpath Robotics)",
        "founded": 2009,
        "country": "Canada",
        "headquarters": "Kitchener, Ontario",
        "owner": "OTTO Motors (Rockwell Automation)",
        "twitter": "@ClearpathRobo",
        "website": "https://clearpathrobotics.com",
        "robot_types": ["mobile", "quadruped"],
        "robots": ["Husky UGV", "Jackal UGV", "Ridgeback"],
        "focus": "Research and outdoor autonomous ground vehicles",
        "notable": "Widely used in university robotics research worldwide.",
        "funding": "Acquired by OTTO Motors",
    },
    {
        "name": "Sanctuary AI",
        "founded": 2018,
        "country": "Canada",
        "headquarters": "Vancouver, BC",
        "owner": "Independent",
        "twitter": "@SanctuaryAI",
        "website": "https://sanctuary.ai",
        "robot_types": ["humanoid"],
        "robots": ["Phoenix"],
        "focus": "General-purpose humanoid with human-like intelligence (Carbon AI)",
        "notable": "Phoenix can perform over 110 unique tasks in retail environments.",
        "funding": "$140M+ raised",
    },
    {
        "name": "Tesla (Optimus)",
        "founded": "Robotics division: 2021",
        "country": "USA",
        "headquarters": "Austin, Texas",
        "owner": "Tesla Inc. (Elon Musk)",
        "twitter": "@Tesla",
        "website": "https://tesla.com/optimus",
        "robot_types": ["humanoid"],
        "robots": ["Optimus Gen 1", "Optimus Gen 2"],
        "focus": "Mass-produced humanoid robot for Tesla factories and general use",
        "notable": "Uses Tesla FSD AI chip. Elon Musk targets $20,000 retail price.",
        "funding": "Funded by Tesla",
    },
    {
        "name": "Xiaomi (CyberOne)",
        "founded": "Robotics: 2022",
        "country": "China",
        "headquarters": "Beijing",
        "owner": "Xiaomi Corporation",
        "twitter": "@xiaomi",
        "website": "https://xiaomi.com",
        "robot_types": ["humanoid"],
        "robots": ["CyberOne"],
        "focus": "Humanoid robot for home assistance and entertainment",
        "notable": "Revealed at 2022 Xiaomi event. Prototype stage.",
        "funding": "Xiaomi internal",
    },
    {
        "name": "DJI",
        "founded": 2006,
        "country": "China",
        "headquarters": "Shenzhen",
        "owner": "Independent",
        "twitter": "@DJIGlobal",
        "website": "https://dji.com",
        "robot_types": ["drone"],
        "robots": ["Phantom", "Mavic", "Mini", "FPV", "Agras (agriculture)"],
        "focus": "Consumer and commercial drones, camera systems",
        "notable": "World leader in consumer drones. ~70% global market share.",
        "funding": "$1.5B+ raised; $16B valuation",
    },
    {
        "name": "Skydio",
        "founded": 2014,
        "country": "USA",
        "headquarters": "San Mateo, California",
        "owner": "Independent",
        "twitter": "@Skydio",
        "website": "https://skydio.com",
        "robot_types": ["drone"],
        "robots": ["Skydio 2+", "Skydio X10"],
        "focus": "Autonomous AI-powered drones for enterprise and defense",
        "notable": "Best-in-class obstacle avoidance AI. US military contracts.",
        "funding": "$340M+ raised",
    },
    {
        "name": "Fetch Robotics (now Zebra Technologies)",
        "founded": 2014,
        "country": "USA",
        "headquarters": "San Jose, California",
        "owner": "Zebra Technologies",
        "twitter": "@FetchRobotics",
        "website": "https://fetchrobotics.com",
        "robot_types": ["logistics", "mobile"],
        "robots": ["Freight500", "Freight1500", "HMIShelf"],
        "focus": "Autonomous mobile robots for warehouse automation",
        "notable": "Acquired by Zebra Technologies for $290M in 2021.",
        "funding": "Acquired",
    },
    {
        "name": "KUKA",
        "founded": 1898,
        "country": "Germany",
        "headquarters": "Augsburg, Bavaria",
        "owner": "Midea Group (China)",
        "twitter": "@KUKARobotics",
        "website": "https://kuka.com",
        "robot_types": ["arm"],
        "robots": ["KUKA KR Series", "LBR iiwa (collaborative)", "KMR mobile arm"],
        "focus": "Industrial robot arms for automotive, aerospace, and manufacturing",
        "notable": "One of the Big 4 robot arm manufacturers globally.",
        "funding": "Acquired by Midea for ~$4.5B in 2016",
    },
    {
        "name": "Universal Robots",
        "founded": 2005,
        "country": "Denmark",
        "headquarters": "Odense",
        "owner": "Teradyne Inc.",
        "twitter": "@UniversalRobots",
        "website": "https://universal-robots.com",
        "robot_types": ["arm"],
        "robots": ["UR3e", "UR5e", "UR10e", "UR16e", "UR20", "UR30"],
        "focus": "Collaborative robot arms (cobots) for SMEs",
        "notable": "Pioneer in collaborative robots. Easy to program, safe for humans.",
        "funding": "Acquired by Teradyne for $285M",
    },
]


def _match(company: dict[str, Any], query: str, robot_type: str) -> bool:
    query_lower = query.lower().strip()
    type_match = (
        robot_type == "all"
        or robot_type in company.get("robot_types", [])
    )
    if not query_lower:
        return type_match
    text = " ".join([
        company.get("name", ""),
        company.get("focus", ""),
        company.get("notable", ""),
        " ".join(company.get("robots", [])),
        " ".join(company.get("robot_types", [])),
    ]).lower()
    return type_match and any(word in text for word in query_lower.split())


def get_robotics_companies(
    query: str = "",
    robot_type: str = "all",
    limit: int = 5,
) -> dict[str, Any]:
    try:
        robot_type = robot_type if robot_type in {
            "all", "humanoid", "quadruped", "arm", "drone", "logistics", "mobile"
        } else "all"
        limit = max(1, min(int(limit or 5), 20))

        matched = [c for c in ROBOTICS_COMPANIES_DB if _match(c, query, robot_type)]

        items = []
        for c in matched[:limit]:
            items.append({
                "title": c["name"],
                "summary": (
                    f"{c['focus']} | Robots: {', '.join(c['robots'][:3])} | "
                    f"HQ: {c.get('headquarters', 'N/A')} | "
                    f"{c.get('notable', '')}"
                ),
                "url": c.get("website", ""),
                "source": "robotics_companies_db",
                "robots": c.get("robots", []),
                "robot_types": c.get("robot_types", []),
                "founded": c.get("founded"),
                "country": c.get("country"),
                "twitter": c.get("twitter"),
                "funding": c.get("funding"),
            })

        return {
            "tool": "robotics_companies",
            "query": query,
            "robot_type": robot_type,
            "total": len(matched),
            "items": items,
        }
    except Exception as exc:
        return {"tool": "robotics_companies", "error": type(exc).__name__, "message": str(exc)}
