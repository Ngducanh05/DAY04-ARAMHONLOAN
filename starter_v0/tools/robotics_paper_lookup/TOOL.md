# robotics_paper_lookup

## Purpose

Retrieve structured academic publication metadata from Crossref for Robotics,
Embodied AI, autonomous systems, Computer Vision, and related research topics.

The tool supports:

- exact DOI lookup;
- DOI URL lookup;
- paper-title search;
- author or keyword search;
- normalized publication metadata.

## When to use

Use this tool when the user:

- provides a DOI and wants paper metadata;
- provides a DOI URL;
- asks to find publication information for a paper title;
- requests papers about a Robotics research topic;
- wants authors, venue, year, DOI, publisher, or citation metadata.

## When not to use

Do not use this tool when:

- the user provides an arXiv ID and wants arXiv-specific metadata;
- the user asks for the full text of an arXiv paper;
- the user asks for general web news;
- the user provides a normal webpage URL;
- the user has not provided enough information to identify a paper or topic.

Use `papers` for arXiv search, `paper_text` for arXiv PDF content, `lookup`
for public web research, and `fetch` for a specific webpage URL.

## Parameters

### query

Required string.

May contain:

- DOI: `10.1109/LRA.2023.1234567`
- DOI URL: `https://doi.org/10.1109/LRA.2023.1234567`
- paper title
- author name
- Robotics keyword

### lookup_type

Optional enum:

- `auto`: detect DOI automatically, otherwise use keyword search
- `doi`: force DOI lookup
- `keyword`: force bibliographic search

Default: `auto`.

### max_results

Maximum keyword-search results.

Allowed range: 1-10.

Default: 5.

## Output

The tool returns:

- normalized DOI;
- title;
- authors;
- publication year;
- venue;
- publisher;
- publication type;
- DOI URL;
- available abstract;
- Crossref citation count;
- source identifier.

## Safety and reliability

- The tool does not invent missing DOI values.
- Invalid DOI values return a controlled error.
- HTTP and parsing failures return structured errors.
- Crossref metadata should be treated as publication metadata, not as proof that
  every technical claim in a paper is correct.
