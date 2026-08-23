# CodeSprout local AI additions

This repository is based on the official Scratch Foundation `scratch-editor` project.

- Original project: https://github.com/scratchfoundation/scratch-editor
- Original license: GNU Affero General Public License v3.0 (see `LICENSE`)
- Scratch trademarks and marks remain subject to `TRADEMARK`.
- The added local AI mentor is in `packages/scratch-gui/src/playground/local-ai-mentor.jsx` and `local-ai-mentor.css`.

The local AI mentor sends questions from the browser to an OpenAI-compatible local endpoint configured by the user. It defaults to Ollama at `http://localhost:11434` and falls back to offline hints when no local model is available.
