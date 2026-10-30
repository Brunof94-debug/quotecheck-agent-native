# QuoteCheck — See the whole quote

Status: submitted on October 30, 2026; official form receipt confirmed. This document preserves the submitted project description and public links.

Creator: Bruno Fernandes, solo.

## Project description

The lowest unit price is not always the lowest complete offer. QuoteCheck is a source-backed workspace for comparing supplier proposals against a purchase brief, finding missing costs and drafting the clarification that could change the decision.

In the fictional packaging example, one supplier quotes a low unit price but leaves freight unpriced. QuoteCheck keeps its total unknown instead of silently treating shipping as zero. The complete offers are checked against quantity, budget, delivery date and recycled-content requirements. Every parsed value links to a numbered source line.

The human interface and local assistant share actual validated Agent-Native actions. A real local model chooses a source to inspect, then drafts a short recommendation and an unsent question. The deterministic comparison handles costs and eligibility; the model handles wording. Changing the brief creates a new revision, removes the old review from the current decision and prevents an in-flight stale draft from being saved. The action history shows human and assistant callers, and the planning memo keeps calculated facts separate from draft prose.

The app directly uses defineAction from @agent-native/core/action 0.222.2, including wrapped run validation, authorization hooks and generated model tool schemas. It uses a custom local HTTP transport and bounded agent runtime, with PGlite persistence and real llama.cpp/Qwen3-4B-Instruct-2507 inference. It does not claim to use the full hosted framework server or its built-in audit service.

The public interactive sample supports brief changes, editable labeled sources, source inspection and memo export in the browser. New model reviews run in the local app shown in the Clips recording. Any saved execution on the sample is clearly labeled as recorded evidence.

Original development began on October 30, 2026, during the hackathon. Bruno is the solo participant; development is assisted by Codex. The UI, domain logic, actions, local transport/runtime, tests and synthetic quotes were newly authored. Pre-existing open-source libraries, model weights and fonts are disclosed in THIRD_PARTY.md. No prior contest app, real supplier/customer data, client validation or business adoption is claimed. QuoteCheck never approves an order or sends a message.

## Submission fields

- First name: Bruno
- Last name: Fernandes
- Contact email: the participant's authorized email, entered privately in the official form
- Project: QuoteCheck — See the whole quote
- Repository: https://github.com/Brunof94-debug/quotecheck-agent-native
- Public sample: https://brunof94-debug.github.io/quotecheck-agent-native/
- Public Clips recording: https://clips.agent-native.com/share/VPtqwOBQYvAU — actual local app, 142 seconds, public page and six video frames checked without authentication
- Slides: optional, leave blank
- Marketing: leave unchecked

The participant authorized the required rules and data processing before the final submission. Marketing was left unchecked. Receipt evidence is linked from participation.md.
