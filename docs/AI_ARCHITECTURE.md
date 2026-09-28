# SMART-TIME V3 Next — AI Architecture

## Target architecture

Mobile/Web UI
  -> Railway SMART-TIME API
  -> AI Orchestrator
  -> authenticated private GPU inference
  -> Qwen3-4B + LoRA + vLLM
  -> structured tool calls
  -> Tool Registry / Executor
  -> validated artifacts / application data
  -> streamed response to UI

## Provider boundary

The application should depend on an AIProvider abstraction:
- chat
- streamChat
- generateStructured
- health
- models

Current provider:
LocalQwenProvider via SMART_AI_LOCAL_URL.

No OpenAI/Gemini/Claude dependency is required for primary intelligence.

## Agent loop

1. Receive user message + relevant context.
2. Ask local model for response or structured tool call.
3. Validate tool name and arguments against schema.
4. Check permissions and confirmation policy.
5. Execute tool.
6. Validate tool result.
7. Feed verified result back to the model.
8. Stream final Egyptian-Arabic response.
9. Persist only required conversation/memory state.

The current code does not yet implement this complete loop; this document defines the target.

## Infrastructure separation

Railway:
- frontend
- API
- authentication
- application database/integrations

GPU service:
- vLLM
- Qwen3-4B
- LoRA adapter
- streaming inference

The GPU endpoint must be private or authenticated and replaceable.

## Artifact architecture

Natural language
 -> structured specification
 -> deterministic generator
 -> validator
 -> storage
 -> preview
 -> download/share

Artifact classes:
- PDF
- DOCX
- XLSX
- SVG
- DXF
- later STEP/3D

## Voice architecture

Microphone
 -> real STT
 -> AI orchestrator
 -> streamed/complete response
 -> TTS
 -> playback

Egyptian Arabic target locale: ar-EG.

Voice DNA remains a separate optional personalization layer and must not be required for basic AI voice operation.

## Memory

Separate:
- recent conversation
- summarized conversation
- user preferences
- application state
- tool results

Do not inject the whole database into every model request.

## Security

- no secrets in prompts
- no customer data in training
- per-user authorization for tools
- confirmation for destructive actions
- file type/size validation
- isolated file processing
- no arbitrary code execution from uploads
