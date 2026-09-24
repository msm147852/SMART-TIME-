# SMART TIME — SMART AI Tool v2.1

SMART AI is an internal tool inside SMART TIME. This phase adds external Python tools behind a dedicated FastAPI service on port 8001.

## Tools
- PDF / Excel / Word report generation
- Brave web search
- Google Maps Directions
- DXF analysis (DWG must be converted to DXF)
- YOLO speed-tool boundary requiring real calibration
- ChromaDB long-term memory

## Run
`pip install -r requirements-smart-ai.txt`

`uvicorn smart_ai_api:app --host 127.0.0.1 --port 8001`

Set `BRAVE_SEARCH_API_KEY` and `GOOGLE_MAPS_API_KEY` in `.env` or the process environment. Do not commit real secrets.

## Scope
Only SMART AI files are introduced in this phase. Existing SMART TIME UI, auth, chat, wallet and unrelated database tables are not modified.
