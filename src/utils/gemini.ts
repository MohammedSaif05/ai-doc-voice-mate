export type ChatMessage = { id: string; role: "user" | "assistant"; text: string };

function toGeminiRole(role: ChatMessage["role"]): "user" | "model" {
  return role === "assistant" ? "model" : "user";
}

export async function callGemini(
  apiKey: string,
  history: ChatMessage[],
  latestUserMessage: string,
  documentContext?: string
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // Limit conversation to last 20 messages
  const limited = history.slice(-20);

  const contents: any[] = limited.map((m) => ({
    role: toGeminiRole(m.role),
    parts: [{ text: m.text }],
  }));

  if (documentContext && documentContext.trim().length > 0) {
    contents.push({
      role: "user",
      parts: [
        {
          text: `Document Context:\n${documentContext}\n\nUser Question:\n${latestUserMessage}`,
        },
      ],
    });
  } else {
    contents.push({ role: "user", parts: [{ text: latestUserMessage }] });
  }

  const body = { contents };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${text}`);
  }

  const json = await res.json();
  // Gemini response path
  const candidate = json?.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  const reply = parts.map((p: any) => p.text).join("\n");
  if (!reply) throw new Error("Empty response from Gemini");
  return reply;
}
