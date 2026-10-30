# QuoteCheck

Work only in this project directory. This is an original Agent-Native Hackathon entry, begun during the build window on 30 October 2026.

- Keep the interface and contest materials in English. Use USD for the authored fictional quote data.
- Define shared, deterministic operations with `defineAction` from `@agent-native/core/action`. The UI and local agent must call the same validated action implementations.
- Keep structured workspace data and the local action log in PGlite. This is a single synthetic local workspace, not a hosted customer service.
- Keep money in integer cents. Missing freight is unknown, never zero. Only facts supported by a source line may appear as verified quote facts.
- Reject reviews for an older brief revision. The assistant drafts a recommendation; the person makes the purchasing decision. Never send messages or place orders.
- Keep model failures visible. Test fixtures are not real model executions. Record actual local model requests and responses separately from tests.
- Do not reuse credentials, private data or code from the other contest projects. Public model weights and official libraries may be downloaded independently.
- Never publish `.runtime/`, local database files, account cookies, credentials or recordings that contain unrelated windows.
- Read the installed, version-matched Agent-Native docs before using unfamiliar framework APIs. Do not edit dependencies.
