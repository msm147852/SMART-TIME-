/**
 * SMART TIME - SMART AI Tool - Unified Brain v2.1
 * This file belongs only to the SMART AI internal tool.
 */
export type SmartAiIntent = "conversation" | "social_emotional" | "economic_analysis" | "web_research" | "report_generation" | "cad_analysis" | "speed_estimation" | "maps" | "app_action";

export interface SmartAiPlan {
  intent: SmartAiIntent;
  confidence: number;
  needsConfirmation: boolean;
  tools: string[];
  entities: Record<string, any>;
  reasoning: string;
}

const KEYWORDS: Record<SmartAiIntent, string[]> = {
  conversation: ["ازيك", "عامل ايه"],
  social_emotional: ["متوتر", "زعلان", "مخنوق", "قلقان", "علاقة", "مضغوط"],
  economic_analysis: ["صرفت", "ميزانية", "فلوس", "جنيه", "مرتب", "مصاريف"],
  web_research: ["ابحث", "سعر اليوم", "اخبار", "search"],
  report_generation: ["pdf", "excel", "تقرير", "شيت", "word"],
  cad_analysis: [".dxf", ".dwg", "كاد", "لوحة"],
  speed_estimation: ["سرعة", "كم/ساعة", "سيارة"],
  maps: ["خريطة", "طريق", "مسافة", "maps"],
  app_action: ["سجل", "احفظ", "ضيف", "امسح", "عدل"]
};

export class SmartAiBrain {
  readonly NO_INVENTION = "SMART AI: ممنوع اختراع ارقام/مسافات/نتائج بحث - لازم verification";

  detectIntent(text: string): SmartAiPlan {
    const lower = text.toLowerCase();
    let best: SmartAiIntent = "conversation";
    let maxScore = 0;
    const entities: Record<string, any> = {};
    const money = lower.match(/(\d+)\s*(جنيه|ج|egp)/);
    if (money) entities.amount = parseInt(money[1], 10);

    for (const [intent, words] of Object.entries(KEYWORDS)) {
      let score = 0;
      for (const w of words) if (lower.includes(w)) score++;
      if (score > maxScore) { maxScore = score; best = intent as SmartAiIntent; }
    }

    return {
      intent: best,
      confidence: Math.min(0.95, 0.4 + maxScore * 0.2),
      needsConfirmation: ["economic_analysis", "app_action", "report_generation"].includes(best),
      tools: this.toolsFor(best),
      entities,
      reasoning: `SMART AI detected ${best}`
    };
  }

  toolsFor(intent: SmartAiIntent): string[] {
    const map: Record<SmartAiIntent, string[]> = {
      conversation: [],
      social_emotional: ["smart_ai_memory.recall", "smart_ai_memory.remember"],
      economic_analysis: ["smart_ai_memory.recall", "smart_ai_tools.create_excel"],
      web_research: ["smart_ai_tools.web_search_brave"],
      report_generation: ["smart_ai_tools.create_pdf", "smart_ai_tools.create_excel", "smart_ai_tools.create_word"],
      cad_analysis: ["smart_ai_cad.analyze_dxf"],
      speed_estimation: ["smart_ai_vision.estimate_vehicle_speed"],
      maps: ["smart_ai_tools.google_maps_route"],
      app_action: ["smartAiExecutor.execute", "verification.readBack"]
    };
    return map[intent] || [];
  }
}
