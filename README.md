# QuoteCheck

**See the whole quote.**

The lowest unit price can hide an incomplete offer. QuoteCheck compares source-backed supplier costs against a purchase brief, keeps unquoted freight unknown, and gives a person and a local assistant the same validated actions for reviewing the decision.

[Interactive sample](https://brunof94-debug.github.io/quotecheck-agent-native/) · [Watch the live demo on Clips](https://clips.agent-native.com/share/VPtqwOBQYvAU) · [Architecture](docs/architecture.md) · [Original work and third-party components](THIRD_PARTY.md)

## The working flow

1. Review three fictional packaging quotes against quantity, budget, deadline and recycled-content requirements.
2. Trace values back to numbered lines in the original proposals.
3. Run a real local model review. It inspects a source and drafts a source-cited explanation and an unsent clarification question.
4. Tighten the deadline and watch the eligible quote change. Earlier reviews keep their original revision; stale in-flight drafts cannot commit.
5. Inspect the shared human/assistant action log and export a planning memo.

The initial example has complete totals of **$2,615** and **$2,650**. The supplier quoting **$2.05 per unit** has no freight amount, so its total remains unknown. Moving the deadline to November 23 leaves only Paperfield as a complete match. A $2,600 budget leaves no complete match.

All suppliers, references and offers are authored fictional examples. QuoteCheck does not contact suppliers, approve purchases, transfer money, fetch certifications or claim real business adoption.

## Agent-Native, used directly

The same six operations are defined with **defineAction from @agent-native/core/action 0.222.2**. Actual wrapped .run calls validate both interface and assistant inputs. Tool schemas are generated from these definitions. PGlite stores the local workspace, revisioned drafts and a separate app action log.

This is a custom, loopback-only HTTP transport and a bounded model runtime, not the full framework's hosted/multi-user server or chat shell. The local assistant makes actual llama.cpp requests to Qwen3-4B-Instruct-2507; no paid provider, API key, external account or canned response is required for local inference. It cannot edit requirements or source quotes. Draft wording always needs human review.

The public Pages build is clearly labeled an **interactive sample**. Its calculations and source/brief edits work in the browser; it does not claim to run the SDK server or generate live model replies. Any published recorded review is frozen evidence of a real local run, not a response to changes made in the sample.

## Run locally

Verified on Windows 11 with Node 22.23.4 and 16 GB RAM. Use **Node >=22.22**. The model download is approximately 2.5 GB; leave memory available for CPU inference. Model/server downloads are independently checksum-verified against their official metadata.

~~~powershell
npm ci
node scripts/setup-model.mjs
powershell -NoProfile -File scripts/start-local.ps1
~~~

Open **http://127.0.0.1:4364/**. The model server listens only on 127.0.0.1:4365. Start/stop scripts affect this project's processes only.

~~~powershell
powershell -NoProfile -File scripts/stop-local.ps1
~~~

The source and UI are portable JavaScript; the supplied binary download/start helpers are Windows-specific. Other systems can use an official llama.cpp server with the same model on port 4365 and run npm start. That path has not been separately verified.

### Direct action CLI

Stop the app before opening its database with the direct CLI:

~~~text
node scripts/quotecheck.mjs compare-quotes
node scripts/quotecheck.mjs inspect-source northline
~~~

These invoke the actual same action module, using caller “cli”. They are app scripts, not the framework's official CLI.

### Checks and static sample

~~~text
npm test
npm run build
~~~

The build output in dist is the browser-only public sample when served outside the local server. Runtime downloads, model logs, session cookies, private local data and node_modules are excluded from Git.

## Current scope

One local fictional workspace, three editable labeled text proposals, USD integer-cent arithmetic, one active review. Source parsing uses explicit labels, not OCR or arbitrary PDF interpretation. Tax must be explicitly included and freight must be explicitly priced before a complete total is available. Unknown fields and unmet requirements are different states.

The model's prose is a draft, not a factual certification. The original lines and independently calculated comparison remain visible. See [security and limitations](docs/security.md).

## Hackathon provenance

Created during the [Builder.io Agent-Native Hackathon](https://www.builder.io/hackathon), starting **30 October 2026**, after the October 27 opening. Bruno Fernandes is the solo participant; development is assisted by Codex. The UI, comparison logic, action definitions, local transport/runtime, tests and synthetic data were newly authored for this entry. Pre-existing libraries, model weights and fonts are disclosed in THIRD_PARTY.md.

**Submitted on October 30, 2026.** The official form confirmed “Your project submission has been received.” See [participation record](docs/participation.md) and the saved confirmation screenshot. This confirms receipt, not an eligibility decision or prize.

Official deadline: November 9, 2026 at 23:59 Pacific / November 10 at 04:59 America/Sao_Paulo. [Official rules](https://www.builder.io/hackathon/rules).

MIT license for original code.
