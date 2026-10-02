export interface GroqModelSummary {
  id: string;
  active?: boolean;
  ownedBy?: string;
}

export interface GroqProviderHealth {
  configured: boolean;
  reachable: boolean;
  models: GroqModelSummary[];
}

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

function getApiKey(): string {
  return String(process.env.GROQ_API_KEY || "").trim();
}

export function isGroqConfigured(): boolean {
  return Boolean(getApiKey());
}

export async function getGroqHealth(): Promise<GroqProviderHealth> {
  const apiKey = getApiKey();
  if (!apiKey) return { configured: false, reachable: false, models: [] };

  const response = await fetch(GROQ_BASE_URL + "/models", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + apiKey,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error("Groq models request failed (" + response.status + ")" + (body ? ": " + body.slice(0, 300) : ""));
  }

  const payload = await response.json() as { data?: Array<{ id?: string; active?: boolean; owned_by?: string }> };
  const models = Array.isArray(payload.data)
    ? payload.data.map((model) => ({
        id: String(model.id || ""),
        active: model.active,
        ownedBy: model.owned_by,
      })).filter((model) => model.id)
    : [];

  return { configured: true, reachable: true, models };
}
