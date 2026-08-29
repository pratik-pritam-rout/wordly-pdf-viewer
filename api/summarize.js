const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const MAX_PAGE_CHARACTERS = 30000;

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return Response.json({ error: "Method not allowed." }, { status: 405 });
    }
    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: "The summary service is not configured." }, { status: 503 });
    }
    try {
      const { text, page, documentName } = await request.json();
      if (typeof text !== "string" || !text.trim()) {
        return Response.json(
          { error: "This page has no readable text to summarize." },
          { status: 400 }
        );
      }
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
          "Api-Revision": "2026-05-20",
        },
        body: JSON.stringify({
          model: "gemini-3.6-flash",
          store: false,
          input: `Summarize page ${page} of \"${documentName || "this PDF"}\". Use 3-5 concise bullet points. Preserve important names, facts, and numbers. Do not invent information.\n\nPage text:\n${text.slice(0, MAX_PAGE_CHARACTERS)}`,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw Error(payload.error?.message || "Gemini could not create a summary.");
      const summary = [
        payload.output_text,
        ...(payload.steps || []).flatMap((step) => step.content || []).map((part) => part.text),
        ...(payload.outputs || []).map((output) => output.text),
      ]
        .filter(Boolean)
        .join("\n")
        .trim();
      if (!summary) throw Error("Gemini returned an empty summary.");
      return Response.json({ summary });
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : "The page could not be summarized." },
        { status: 500 }
      );
    }
  },
};
