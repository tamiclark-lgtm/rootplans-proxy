module.exports = async (req, res) => {
  const allowedOrigins = new Set([
    "https://rootplans.com",
    "https://www.rootplans.com",
    "https://tamiclark-lgtm.github.io"
  ]);

  const origin = req.headers.origin || "";

  if (allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const body = req.body || {};
    const prompt = body.prompt;

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "Missing ANTHROPIC_API_KEY in Vercel" });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const rawText = await anthropicRes.text();

    if (!anthropicRes.ok) {
      return res.status(500).send(`Anthropic error: ${rawText}`);
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      return res.status(500).send("Anthropic returned invalid JSON");
    }

    const text = (data.content || [])
      .filter(block => block.type === "text")
      .map(block => block.text)
      .join("\n")
      .trim();

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).send(`Proxy error: ${error.message}`);
  }
};
