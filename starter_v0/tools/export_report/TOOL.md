---
name: export_report
track: custom
kind: local_file
requires_env: []
inputs: [title, content, format]
outputs: [filepath, bytes_written, status]
side_effect: true
---
# export_report

Exports research findings, digests, or reports to a local file in Markdown or Text format.
