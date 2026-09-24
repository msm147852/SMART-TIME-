import ezdxf
from pathlib import Path

def analyze_dxf(file_path: str):
    path = Path(file_path)
    if path.suffix.lower() == ".dwg": return {"tool": "SMART AI CAD", "error": "DWG غير مدعوم مباشرة - حوله ل DXF", "no_invention": True}
    if path.suffix.lower() != ".dxf": raise ValueError("SMART AI CAD: expected DXF")
    doc = ezdxf.readfile(str(path)); counts = {}
    for e in doc.modelspace(): counts[e.dxftype()] = counts.get(e.dxftype(), 0) + 1
    return {"tool": "SMART AI CAD", "entity_counts": counts, "total": sum(counts.values()), "status": "OK"}
