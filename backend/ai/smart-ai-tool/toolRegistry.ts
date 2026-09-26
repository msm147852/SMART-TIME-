import type { V3ToolName } from "./types.js";
export interface V3ToolDefinition { name: V3ToolName; description: string; requiresConfirmation: boolean; permission?: string; }
export const v3ToolRegistry: Record<V3ToolName, V3ToolDefinition> = {
  web_search:{name:"web_search",description:"بحث ويب بدون مفتاح API",requiresConfirmation:false},
  solve_emotional_problem:{name:"solve_emotional_problem",description:"حل مشكلة عاطفية",requiresConfirmation:false},
  solve_social_problem:{name:"solve_social_problem",description:"حل مشكلة اجتماعية",requiresConfirmation:false},
  solve_economic_problem:{name:"solve_economic_problem",description:"تحليل اقتصادي وتوفير",requiresConfirmation:false,permission:"expenses"},
  generate_excel_report:{name:"generate_excel_report",description:"تقرير Excel",requiresConfirmation:false,permission:"reports"},
  generate_word_report:{name:"generate_word_report",description:"تقرير Word",requiresConfirmation:false,permission:"reports"},
  generate_pdf_report:{name:"generate_pdf_report",description:"تقرير PDF",requiresConfirmation:false,permission:"reports"},
  generate_chart:{name:"generate_chart",description:"رسم بياني",requiresConfirmation:false,permission:"reports"},
  draw_plan:{name:"draw_plan",description:"رسم مخطط SVG",requiresConfirmation:false,permission:"reports"},
  request_permissions:{name:"request_permissions",description:"طلب صلاحيات اختيارية",requiresConfirmation:false}
};
export function isV3ToolName(value: string): value is V3ToolName { return Object.prototype.hasOwnProperty.call(v3ToolRegistry, value); }
