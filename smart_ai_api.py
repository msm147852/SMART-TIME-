"""SMART TIME - SMART AI Tool API. This service exposes SMART AI tools only."""
from fastapi import FastAPI, UploadFile, File
from tools.smart_ai.smart_ai_tools import create_pdf, create_excel, create_word, web_search_brave, google_maps_route
from tools.smart_ai.smart_ai_cad import analyze_dxf
from tools.smart_ai.smart_ai_vision import estimate_vehicle_speed
from tools.smart_ai.smart_ai_memory import SmartAiMemory
from dotenv import load_dotenv
import tempfile, os
load_dotenv()
app = FastAPI(title="SMART TIME - SMART AI Tool v2.1")
mem = SmartAiMemory()

@app.get("/")
def home(): return {"program":"SMART TIME","tool":"SMART AI","version":"v2.1","status":"ready","tools":["pdf","excel","word","cad","speed","maps","search","memory"]}
@app.post("/smart-ai/memory/remember")
def remember(user_id: str, text: str, type: str="general", explicit: bool=True): return {"id": mem.remember(user_id,text,type,explicit=explicit)}
@app.get("/smart-ai/memory/recall")
def recall(user_id: str, query: str): return mem.recall(user_id,query)
@app.get("/smart-ai/search")
def search(q: str): return web_search_brave(q)
@app.get("/smart-ai/maps")
def maps_route(origin: str, destination: str): return google_maps_route(origin,destination)
@app.post("/smart-ai/reports")
def reports(payload: dict):
    tool, filename = payload.get("tool"), payload.get("filename", "smart_ai_report")
    if tool == "smart_ai_tools.create_pdf": return {"path": create_pdf(filename,payload.get("title","SMART AI Report"),payload.get("content",""),payload.get("table_data"))}
    if tool == "smart_ai_tools.create_excel": return {"path": create_excel(filename,payload.get("data",[]))}
    if tool == "smart_ai_tools.create_word": return {"path": create_word(filename,payload.get("title","SMART AI Report"),payload.get("content",""))}
    return {"error":"Unsupported report tool"}
@app.post("/smart-ai/cad/analyze")
def cad_analyze(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename or "upload.dxf")[1]
    with tempfile.NamedTemporaryFile(delete=False,suffix=suffix) as f:
        f.write(file.file.read()); tmp=f.name
    try: return analyze_dxf(tmp)
    finally: os.unlink(tmp)
@app.post("/smart-ai/vision/speed")
def speed(payload: dict): return estimate_vehicle_speed(payload["video_path"],payload.get("real_world_distance_m"))
