from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from tools._shared import err


def export_report(title: str, content: str, file_format: str = "markdown") -> dict[str, Any]:
    try:
        exports_dir = Path(__file__).parents[2] / "exports"
        exports_dir.mkdir(parents=True, exist_ok=True)

        slug = re.sub(r"[^A-Za-z0-9_.-]+", "_", title.strip()).strip("_") or "report"
        ext = ".md" if file_format.lower() in {"md", "markdown"} else ".txt"
        file_path = exports_dir / f"{slug}{ext}"

        file_content = f"# {title}\n\n{content}\n" if ext == ".md" else f"{title}\n\n{content}\n"
        file_path.write_text(file_content, encoding="utf-8")

        return {
            "tool": "export_report",
            "title": title,
            "file_path": str(file_path),
            "file_format": file_format,
            "bytes_written": len(file_content.encode("utf-8")),
            "status": "success",
        }
    except Exception as exc:
        return err("export_report", exc)
