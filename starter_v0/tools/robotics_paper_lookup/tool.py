from __future__ import annotations

import os
import re
from typing import Any
from urllib.parse import quote

import requests

from tools._shared import TIMEOUT, err


CROSSREF_API_URL = "https://api.crossref.org/works"
DEFAULT_LIMIT = 5
MAX_LIMIT = 10


def _crossref_user_agent() -> str:
    """Return a descriptive User-Agent for Crossref requests."""
    contact_email = os.getenv("CROSSREF_CONTACT_EMAIL", "local@example.com")
    return (
        "AI20k-Day04-Robotics-Research-Agent/1.0 "
        f"(educational lab; mailto:{contact_email})"
    )


def _normalize_text(value: Any) -> str:
    if isinstance(value, list):
        value = value[0] if value else ""
    return " ".join(str(value or "").split())


def _normalize_doi(value: str) -> str:
    """Extract a DOI from plain DOI text or doi.org URL."""
    cleaned = (value or "").strip()

    cleaned = re.sub(
        r"^https?://(?:dx\.)?doi\.org/",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )
    cleaned = re.sub(
        r"^doi:\s*",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )

    match = re.search(r"10\.\d{4,9}/[-._;()/:A-Z0-9]+", cleaned, re.IGNORECASE)
    return match.group(0).rstrip(".,;") if match else ""


def _publication_year(item: dict[str, Any]) -> int | None:
    for key in ("published-print", "published-online", "published", "issued"):
        date_parts = item.get(key, {}).get("date-parts", [])
        if date_parts and date_parts[0]:
            try:
                return int(date_parts[0][0])
            except (TypeError, ValueError):
                continue
    return None


def _authors(item: dict[str, Any]) -> list[str]:
    result: list[str] = []

    for author in item.get("author", []) or []:
        given = _normalize_text(author.get("given"))
        family = _normalize_text(author.get("family"))
        name = " ".join(part for part in (given, family) if part)

        if name:
            result.append(name)

    return result


def _normalize_item(item: dict[str, Any]) -> dict[str, Any]:
    doi = _normalize_text(item.get("DOI"))
    title = _normalize_text(item.get("title"))
    venue = _normalize_text(item.get("container-title"))
    abstract = _normalize_text(item.get("abstract"))

    if abstract:
        abstract = re.sub(r"<[^>]+>", " ", abstract)
        abstract = " ".join(abstract.split())

    return {
        "doi": doi,
        "title": title,
        "authors": _authors(item),
        "year": _publication_year(item),
        "venue": venue,
        "publisher": _normalize_text(item.get("publisher")),
        "type": _normalize_text(item.get("type")),
        "url": _normalize_text(item.get("URL"))
        or (f"https://doi.org/{doi}" if doi else ""),
        "abstract": abstract,
        "citation_count": item.get("is-referenced-by-count"),
        "source": "crossref.org",
    }


def _crossref_get(
    url: str,
    *,
    params: dict[str, Any] | None = None,
) -> requests.Response:
    headers = {
        "Accept": "application/json",
        "User-Agent": _crossref_user_agent(),
    }

    return requests.get(
        url,
        params=params,
        headers=headers,
        timeout=TIMEOUT,
    )


def robotics_paper_lookup(
    query: str = "",
    lookup_type: str = "auto",
    max_results: int = DEFAULT_LIMIT,
) -> dict[str, Any]:
    """
    Look up academic paper metadata from Crossref.

    Args:
        query:
            A DOI, DOI URL, paper title, author, or research keyword.
        lookup_type:
            "auto", "doi", or "keyword".
        max_results:
            Maximum number of records for keyword search.

    Returns:
        A serializable dictionary containing normalized paper metadata.
    """
    try:
        cleaned_query = " ".join((query or "").split())

        if not cleaned_query:
            return {
                "tool": "robotics_paper_lookup",
                "query": query,
                "lookup_type": lookup_type,
                "items": [],
                "error": "missing_query",
                "message": "A DOI, paper title, author, or keyword is required.",
            }

        normalized_type = (lookup_type or "auto").strip().lower()
        if normalized_type not in {"auto", "doi", "keyword"}:
            normalized_type = "auto"

        doi = _normalize_doi(cleaned_query)
        use_doi = normalized_type == "doi" or (
            normalized_type == "auto" and bool(doi)
        )

        if use_doi:
            if not doi:
                return {
                    "tool": "robotics_paper_lookup",
                    "query": cleaned_query,
                    "lookup_type": "doi",
                    "items": [],
                    "error": "invalid_doi",
                    "message": "The provided value does not contain a valid DOI.",
                }

            response = _crossref_get(f"{CROSSREF_API_URL}/{quote(doi, safe='')}")
            response.raise_for_status()

            payload = response.json()
            message = payload.get("message", {})

            return {
                "tool": "robotics_paper_lookup",
                "query": cleaned_query,
                "lookup_type": "doi",
                "total_results": 1,
                "items": [_normalize_item(message)],
            }

        limit = max(1, min(int(max_results or DEFAULT_LIMIT), MAX_LIMIT))

        response = _crossref_get(
            CROSSREF_API_URL,
            params={
                "query.bibliographic": cleaned_query,
                "rows": limit,
                "select": (
                    "DOI,title,author,published-print,published-online,"
                    "published,issued,container-title,publisher,type,URL,"
                    "abstract,is-referenced-by-count"
                ),
            },
        )
        response.raise_for_status()

        payload = response.json()
        message = payload.get("message", {})
        raw_items = message.get("items", []) or []

        return {
            "tool": "robotics_paper_lookup",
            "query": cleaned_query,
            "lookup_type": "keyword",
            "total_results": message.get("total-results"),
            "items": [_normalize_item(item) for item in raw_items],
        }

    except requests.HTTPError as exc:
        status_code = exc.response.status_code if exc.response is not None else None

        if status_code == 404:
            return {
                "tool": "robotics_paper_lookup",
                "query": query,
                "lookup_type": lookup_type,
                "items": [],
                "error": "not_found",
                "message": "No Crossref paper metadata was found for this query.",
            }

        return err("robotics_paper_lookup", exc)

    except Exception as exc:
        return err("robotics_paper_lookup", exc)
