# SMART AI Phase 3 validation

The Phase 3 external-tool files are isolated under `backend/ai/smart-ai-tool/` and `tools/smart-ai/`, with the FastAPI bridge at the repository root. Real API keys are never committed.

Validation that requires the full Node repository or live provider services must be run in the project CI/runtime; this connector cannot execute `npm install`, `tsc`, or live FastAPI/SQLite services against GitHub directly.
