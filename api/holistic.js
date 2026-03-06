export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {

    const { prompt } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    const text = data.content
      ?.filter(x => x.type === "text")
      ?.map(x => x.text)
      ?.join("\n") || "No response";

    return res.status(200).json({ text });

  } catch (error) {
    console.error(error);
    return res.status(500).send("Proxy error");
  }
}
