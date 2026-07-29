from __future__ import annotations

from typing import Any

from tools._shared import err


def translate(text: str, target_language: str = "Vietnamese") -> dict[str, Any]:
    try:
        lang = target_language.strip().capitalize()
        return {
            "tool": "translate",
            "original_text": text,
            "target_language": lang,
            "translated_text": f"[{lang} Translation] {text}",
            "status": "success",
        }
    except Exception as exc:
        return err("translate", exc)
