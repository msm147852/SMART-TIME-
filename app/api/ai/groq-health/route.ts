import { getGroqHealth } from "../../../../backend/ai/providers/groqProvider.js";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(): Promise<Response> {
  // Preparation-only endpoint: never expose provider diagnostics from production.
  if (process.env.VERCEL_ENV !== "preview" && process.env.NODE_ENV === "production") {
    return json({ error: "preview-only" }, 404);
  }

  try {
    const health = await getGroqHealth();
    return json({
      provider: "groq",
      configured: health.configured,
      reachable: health.reachable,
      modelCount: health.models.length,
      models: health.models.map(({ id, active, ownedBy }) => ({ id, active, ownedBy })),
    });
  } catch (error) {
    return json({
      provider: "groq",
      configured: true,
      reachable: false,
      error: error instanceof Error ? error.message : "Groq health check failed",
    }, 502);
  }
}
