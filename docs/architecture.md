# One operation, two ways to use it

QuoteCheck brings the interface and a small local agent to the same source-backed buying decision.

~~~mermaid
flowchart LR
  H[Human UI] --> T[Local HTTP transport]
  T --> A[Agent-Native defineAction / run]
  M[Local Qwen review runtime] --> A
  C[Direct app CLI] --> A
  A --> D[(PGlite workspace)]
  D --> E[Revisioned sources and review drafts]
  D --> L[Local action log]
  E --> H
~~~

## Actual framework integration

The actions module imports defineAction from @agent-native/core/action 0.222.2. Every human, assistant and direct CLI invocation crosses the wrapped .run method, including its schema validator and our capability authorization hook. The model output schemas come from those same actions' generated .tool.parameters; they are not separately maintained imitation schemas.

The app uses a custom loopback HTTP transport and bounded model loop. It does not use or claim the full Agent-Native Nitro server, hosted organizations, native chat shell, official CLI, MCP service or SDK built-in audit. SDK audit is explicitly disabled; our separate SQL action log records caller, operation, status, duration and hashes. No hosted telemetry provider is configured.

| Shared operation | Human | Assistant |
| --- | --- | --- |
| get-workspace | Load workspace | Available through the action module |
| compare-quotes | Refresh comparison | Read exact costs, eligibility and ranking |
| inspect-source | Open the original quote | Model selects one source to inspect |
| propose-review | Same action boundary is available | Validate and save a cited draft |
| update-brief / update-source | Edit fictional local workspace | Explicitly excluded |

The public GitHub Pages build is a clearly labeled **interactive sample**, with browser-local calculation and edits. It does not pretend to invoke the server-side SDK or a model. The required Clips demonstration shows the actual local application. Saved model evidence is labeled as a previous execution and keeps its original brief and sources.

## Bounded model workflow

1. The runtime invokes compare-quotes, using integer cents and explicit source fields.
2. A real local model request chooses a source to inspect. Its JSON schema comes from the native inspect-source action.
3. That action reads exact numbered source lines. Source text is data, not agent instructions.
4. A second real local request drafts an explanation and an unsent clarification question. The comparison determines which quote ranks first; the model does not calculate money or change constraints. The output is constrained to that eligible candidate (or null when none is eligible).
5. The propose-review action validates source IDs, quote eligibility and the revision before saving. A second revision check occurs inside the SQL transaction. A changed brief or source rejects the stale result.

There is no fake model response or templated fallback. A model/network/validation failure is shown in the interface and leaves no new saved review. Draft prose is not certified fact: source links and the independently calculated comparison remain visible for human review. The runtime cannot send messages, approve orders, browse websites or execute arbitrary tools.

## Scope

Single local synthetic workspace, one active review, one local model. Text sources follow a documented labeled format; this is not OCR or arbitrary PDF extraction. Freight, setup, quantity, unit cost, tax inclusion, delivery and recycled content are checked. “Tax: included” is required for a complete total; unknown tax or freight stays unknown.

This is a prototype for exploring supplier comparisons, not a production procurement service or autonomous buyer.
