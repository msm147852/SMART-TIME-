# Phase A2 — Groq STT Runtime Evidence Runbook

Branch: `feat/v3-next`

## Runtime target

`Microphone -> MediaRecorder -> authenticated /api/ai/stt -> Groq Whisper -> transcript`

Primary Arabic locale: `ar-EG`. The provider request uses Groq's supported Arabic language code while the application contract reports `ar-EG`.

## Required six cases

1. **Real Egyptian Arabic microphone**
   - Allow microphone.
   - Speak naturally in Egyptian Arabic.
   - PASS requires non-empty transcript and response locale `ar-EG`.
   - No action is executed from STT alone.

2. **Egyptian Arabic + English code-switch**
   - Speak a natural sentence containing common English terms.
   - PASS requires the spoken English terms to remain present when actually spoken.
   - No fabricated words.

3. **Numbers and dates**
   - Speak Egyptian Arabic containing numbers, dates, and/or times.
   - PASS requires the transcript to preserve the spoken numeric/date content sufficiently for downstream parsing.

4. **Permission denial**
   - Deny microphone permission.
   - PASS requires an explicit `not-allowed` UI error.
   - No STT request and no transcript/action may be produced.

5. **Provider/network failure**
   - With microphone permission granted, force the STT provider/network path to fail (for example by temporarily blocking the staging provider request in the browser/network test environment).
   - PASS requires explicit provider/network error handling and no action.

6. **Noisy/ambiguous speech**
   - Use realistic background noise or ambiguous speech.
   - PASS requires the observed transcript, including an empty/uncertain result when appropriate; the UI/backend must never invent an action from missing speech.

## Evidence to record for each case

- timestamp
- browser + version
- OS
- application build/commit
- microphone permission state
- response HTTP status
- provider/model/locale metadata (never API key)
- short transcript excerpt
- PASS/FAIL
- screenshot or browser console/network evidence where relevant

## Security checks

- `GROQ_API_KEY` is never entered in the browser.
- The client sends audio only to `/api/ai/stt`.
- The server authenticates the request.
- Audio is not persisted by SMART TIME.
- Payload size and per-user rate limits are enforced.
- Provider errors do not expose the provider secret.

## Closure rule

A2 remains OPEN until all six runtime cases have reproducible evidence and the A2 closure record is updated. CI/static verification and Railway deployment success are necessary but are not a substitute for real microphone/runtime evidence.
