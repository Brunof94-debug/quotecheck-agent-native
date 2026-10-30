# Third-party components and original work

QuoteCheck was created for the Agent-Native Hackathon, starting 30 October 2026, after the 27 October opening. The original domain logic, shared actions, local HTTP transport, bounded review runtime, UI, styling, synthetic supplier quotes, tests and project materials were authored during the event with Codex assistance. No prior contest app or customer data was copied.

This is a custom application, not a renamed example app. The upstream Agent-Native application templates were inspected for documentation; none was copied into this repository.

| Component | Use | License / upstream |
| --- | --- | --- |
| Agent-Native Core 0.222.2 | Actual defineAction input validation, authorization hook and generated tool schemas | MIT · [BuilderIO/agent-native](https://github.com/BuilderIO/agent-native) |
| React / React DOM | Application UI | MIT · [facebook/react](https://github.com/facebook/react) |
| Vite / React plugin | Development server and static build | MIT · [vitejs/vite](https://github.com/vitejs/vite) |
| Zod | Shared action schemas | MIT · [colinhacks/zod](https://github.com/colinhacks/zod) |
| PGlite | Local PostgreSQL-compatible persistence | Apache-2.0 · [electric-sql/pglite](https://github.com/electric-sql/pglite) |
| llama.cpp b11960 | Independently downloaded local inference server | MIT · [ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp) |
| Qwen3-4B-Instruct-2507 Q4_K_M, Unsloth conversion | Independently downloaded local text model | Apache-2.0 · [model card](https://huggingface.co/unsloth/Qwen3-4B-Instruct-2507-GGUF) / [Qwen](https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507) |
| DM Sans / Manrope | Google Fonts typography | SIL Open Font License · [DM Sans](https://github.com/google/fonts/tree/main/ofl/dmsans), [Manrope](https://github.com/google/fonts/tree/main/ofl/manrope) |
| Node.js | Local JavaScript runtime | [Node.js license and bundled notices](https://github.com/nodejs/node/blob/main/LICENSE) |

The package lock records the full dependency graph. Model binaries and runtime files are not distributed in the repository. The setup script verifies downloads against official release metadata, pins the model revision and writes the resulting hashes to the ignored local runtime folder.

The three suppliers, quote references, prices and purchasing brief are fictional authored examples. Names do not imply endorsement or real offers. No external validation, client adoption, revenue or procurement result is claimed.
