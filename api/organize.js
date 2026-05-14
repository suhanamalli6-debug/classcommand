export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are allowed." });
  }

  try {
    const { brainDump } = req.body || {};

    if (!brainDump || brainDump.trim().length === 0) {
      return res.status(400).json({ error: "Brain dump is required." });
    }

    const prompt = `
You are the strict AI organizer for ClassCommand, a high school planning app.

Student profile:
- Freshman ending 9th grade
- Period 1: English 9HP
- Period 2: Freshman Co-Ed PE
- Period 3: Biology P
- Period 4: Speech P
- Period 5: Algebra 2HP
- Period 6: Spanish 1P
- Period 7: Understanding Catholicism

Priority rules:
- Algebra 2HP is Critical
- Biology P is High
- Spanish 1P is Medium-High
- Everything else is Normal unless urgent
- Physical handouts need due date, completed status, backpack status, and turned-in status

Take this messy student brain dump and convert it into organized JSON.

Brain dump:
${brainDump}

Return ONLY valid JSON with this exact structure:
{
  "commanderStatus": "strict one sentence summary",
  "tasks": [
    {
      "className": "one of the student's classes",
      "title": "specific task",
      "type": "Homework | Study | Quiz | Test | Final | Project | Handout | Essay | Presentation | Clarify",
      "due": "specific due date or Needs date",
      "priority": "Critical | High | Medium-High | Normal | Low/Normal",
      "time": "estimated time like 25 min",
      "source": "Brain dump",
      "reason": "why this task matters"
    }
  ],
  "missingInfo": [
    "questions or dates the student needs to clarify"
  ]
}
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenAI request failed.",
      });
    }

    const text =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      "";

    const cleaned = text
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();

    const organized = JSON.parse(cleaned);

    return res.status(200).json(organized);
  } catch (error) {
    return res.status(500).json({
      error: "Could not organize the brain dump.",
      details: error.message,
    });
  }
}
