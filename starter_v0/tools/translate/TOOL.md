---
name: translate
track: custom
kind: local_transform
requires_env: []
inputs: [text, target_language]
outputs: [original_text, translated_text, target_language, status]
side_effect: false
---
# translate

Translates content or digest summaries to the specified target language.
