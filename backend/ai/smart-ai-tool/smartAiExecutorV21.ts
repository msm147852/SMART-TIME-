import { request } from "node:http";
const API_BASE = process.env.SMART_AI_API_URL || "http://127.0.0.1:8001";
export class SmartAiExecutorV21 {
  private call(path: string, method: string, body?: unknown): Promise<any> { return new Promise((resolve,reject)=>{ const u=new URL(path,API_BASE); const payload=body===undefined?undefined:JSON.stringify(body); const r=request(u,{method,headers:{"Content-Type":"application/json"}},res=>{let raw=""; res.setEncoding("utf8"); res.on("data",c=>raw+=c); res.on("end",()=>{let data:any;try{data=JSON.parse(raw)}catch{data={raw}}; if((res.statusCode||500)>=400) reject(new Error(data?.detail||data?.error||`SMART AI API ${res.statusCode}`)); else resolve(data);});}); r.on("error",reject); r.end(payload);}); }
  search(query:string){return this.call(`/smart-ai/search?q=${encodeURIComponent(query)}`,"GET")}
  maps(origin:string,destination:string){return this.call(`/smart-ai/maps?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,"GET")}
  report(tool:string,params:any){return this.call("/smart-ai/reports","POST",{tool,...params})}
}
