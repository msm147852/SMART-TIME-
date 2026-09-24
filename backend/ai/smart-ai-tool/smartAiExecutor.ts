import { request } from "node:http";
import { createReadStream } from "node:fs";
import { basename } from "node:path";

const API_BASE = process.env.SMART_AI_API_URL || "http://127.0.0.1:8001";

export class SmartAiExecutor {
  private async get(path: string, params: Record<string, string>): Promise<any> {
    const url = new URL(path, API_BASE);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return this.http(url, { method: "GET" });
  }

  private async http(url: URL, options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const req = request(url, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } }, res => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", c => { body += c; });
        res.on("end", () => {
          let parsed: any;
          try { parsed = JSON.parse(body); } catch { parsed = { raw: body }; }
          if ((res.statusCode || 500) >= 400) return reject(new Error(parsed?.detail || parsed?.error || `SMART AI API HTTP ${res.statusCode}`));
          resolve(parsed);
        });
      });
      req.on("error", reject);
      req.end(options.body);
    });
  }

  async executeExternal(tool: string, params: Record<string, any>): Promise<any> {
    switch (tool) {
      case "smart_ai_tools.web_search_brave":
        return this.get("/smart-ai/search", { q: String(params.query || "") });
      case "smart_ai_tools.google_maps_route":
        return this.get("/smart-ai/maps", { origin: String(params.origin || ""), destination: String(params.destination || "") });
      case "smart_ai_tools.create_pdf":
      case "smart_ai_tools.create_excel":
      case "smart_ai_tools.create_word":
        return this.http(new URL("/smart-ai/reports", API_BASE), { method: "POST", body: JSON.stringify({ tool, ...params }) });
      default:
        throw new Error(`Unsupported SMART AI external tool: ${tool}`);
    }
  }

  async execute(plan: any, params: any, userId: string) {
    if (plan?.intent === "app_action" || plan?.intent === "economic_analysis") {
      throw new Error("SMART AI Tool v2.1: application DB mutations remain delegated to the existing Phase 2 executor; this external executor does not fabricate or replace SMART TIME DB operations.");
    }
    const tool = plan?.tools?.[0];
    if (!tool) throw new Error("SMART AI: no executable tool in plan");
    return this.executeExternal(tool, { ...params, userId });
  }

  async verify(id: string) {
    return { exists: false, error: `External tool verification requires provider-specific read-back for ${id}` };
  }
}
