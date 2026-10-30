# Local prototype boundaries

The server binds to 127.0.0.1, enforces the expected Host and Origin for changes, uses an HttpOnly SameSite=Strict session cookie plus a per-session request token, bounds request/source sizes and dispatches an explicit action allowlist. The action module also requires an in-memory capability. The model URL must be an HTTP loopback endpoint.

This protects the intended local synthetic workflow; it is not production multi-user authentication. Do not expose the local ports through a public tunnel or store real commercial/customer documents in this prototype. There is no remote account service or tenant isolation.

Source text and user focus are untrusted data. The local model has access only to read comparison facts, inspect one quote and propose a current-revision review. It cannot change source/brief data, execute commands, send email, place an order or use account credentials.

Review schema checks catch unknown source IDs, ineligible candidates and stale revisions. The model can still write misleading prose or cite an insufficient line, so draft wording is explicitly marked for human review. Source links do not imply that every generated statement has been independently verified.

The local SQL action log is an app implementation, not Agent-Native's built-in audit service. It stores operation/caller/status/timing and request/response hashes. Real model request/response traces remain in the ignored runtime folder; only deliberately selected, fictional, reviewed evidence is published.

## Dependency review

The initial package audit led to patched Vite, Zod, Better Auth, Anthropic and MCP versions pinned through the lockfile and compatible overrides. The remaining audit findings are in the framework's transitive AG-UI dependency, which uses Zod 3; replacing it with a new major version would risk an unsupported framework combination.

That AG-UI protocol path is not exposed by this app's custom transport. Action schemas use the directly patched Zod 4 package, and local requests have explicit size bounds. This is a scoped mitigation, not a claim of a clean audit. Reassess upstream versions before adapting this prototype into a network service.
