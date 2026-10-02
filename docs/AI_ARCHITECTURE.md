# SMART-TIME V3 Next — AI Architecture

## Canonical production target

Mobile/Web UI
  -> Railway SMART-TIME API
  -> AI Provider Gateway
  -> Groq API
  -> RAG / Knowledge / Memory context
  -> structured output / tool calls
  -> Policy + Schema Validator
  -> Tool Registry / Executor
  -> verified application data / artifacts
  -> grounded response
  -> TTS
  -> streamed response / audio to UI

Voice path:
  Microphone -> server-side STT (Groq Whisper) -> Groq reasoning -> RAG/Knowledge -> structured output -> Tools/Actions -> verified response -> TTS -> playback.

## Provider boundary

The application depends on an AIProvider abstraction:
- chat
- streamChat
- generateStructured
- health
- models

Production provider:
- Groq, configured server-side.

Preserved non-production provider:
- Local Qwen3-4B + LoRA/vLLM implementation remains available as a historical/experimental/future provider asset. It is not the production default under the current plan.

The provider key must never be exposed to the browser or embedded in VITE_* variables.

## Agent loop

1. Receive user text or verified STT transcript.
2. Normalize and attach permitted context.
3. Retrieve relevant knowledge/memory/application context.
4. Ask the configured provider for grounded text or a structured tool proposal.
5. Validate schema/tool name/arguments.
6. Apply permission and confirmation policy.
7. Execute approved tool.
8. Read back and verify authoritative state.
9. Feed verified result back when a final response needs it.
10. Produce a grounded response.
11. Synthesize TTS when the interaction is voice.
12. Persist only required conversation/memory state.

No free-text model response is treated as an executable action.

## Infrastructure separation

Railway:
- API
- authentication
- application database/integrations
- server-side AI provider gateway
- server-side STT request handling

Groq:
- production LLM inference
- production speech-to-text

Preserved GPU/local stack:
- vLLM/Qwen/LoRA assets remain isolated and non-production by default.

## Artifact architecture

Natural language
 -> structured specification
 -> deterministic generator
 -> validator
 -> storage
 -> preview
 -> download/share

Every generated artifact must be validated by its actual engine/parser before success is reported.

## Memory

Separate:
- recent conversation
- summarized conversation
- user preferences
- application state
- verified tool results
- retrieved knowledge

Do not inject the whole database into model requests.

## Security

- provider secrets server-side only
- no secrets in prompts or browser bundles
- no customer data in training
- per-user authorization for tools
- confirmation for destructive actions
- request size/duration limits for STT
- raw user audio not persisted by default
- file type/size validation
- isolated file processing
- no arbitrary code execution from uploads
