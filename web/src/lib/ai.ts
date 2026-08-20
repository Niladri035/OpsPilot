export type AiIncidentInput = {
  title: string;
  severity: string;
  status: string;
  monitorName?: string;
  monitorUrl?: string;
  lastCheckedAt?: string | null;
};

export type AiIncidentOutput = {
  rootCause: string;
  reasoning: string;
  recommendation: string;
};

function mockAnalysis(input: AiIncidentInput): AiIncidentOutput {
  return {
    rootCause: `Health check failed for ${input.monitorName || "the monitored service"}.`,
    reasoning: `The incident "${input.title}" indicates that the endpoint ${
      input.monitorUrl || "unknown URL"
    } did not return a successful response. This can happen because the service is down, the network is unreachable, the deployment failed, or a dependency such as a database is not responding.`,
    recommendation: `1. Check the service logs.
2. Restart the service.
3. Verify the latest deployment.
4. Check database connectivity.
5. Confirm the health endpoint is publicly accessible.`,
  };
}

function safeParseJson(content: string): Record<string, unknown> {
  try {
    return JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return {};
      }
    }

    return {};
  }
}

async function analyzeWithGemini(input: AiIncidentInput): Promise<AiIncidentOutput> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not set");
  }

  const prompt = `You are OpsPilot, an expert DevOps AI incident assistant.

Analyze this incident and return ONLY valid JSON. No markdown, no code blocks, no explanation outside JSON.

Incident title: ${input.title}
Severity: ${input.severity}
Status: ${input.status}
Monitor name: ${input.monitorName || "Unknown"}
Monitor URL: ${input.monitorUrl || "Unknown"}
Last checked at: ${input.lastCheckedAt || "Unknown"}

Return JSON with exactly these fields:
{
  "rootCause": "short description of the most likely root cause",
  "reasoning": "explain why you think this is the cause based on the incident data",
  "recommendation": "numbered list of recommended actions to fix this issue"
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No response from Gemini");
  }

  const parsed = safeParseJson(text);

  return {
    rootCause: String(parsed.rootCause || "Unable to determine root cause."),
    reasoning: String(parsed.reasoning || "No detailed reasoning provided."),
    recommendation: String(
      parsed.recommendation || "Check service logs and restart the service."
    ),
  };
}

async function analyzeWithOpenAI(input: AiIncidentInput): Promise<AiIncidentOutput> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set");
  }

  const OpenAI = (await import("openai")).default;

  const client = new OpenAI({
    apiKey,
  });

  const prompt = `You are OpsPilot, an expert DevOps AI incident assistant.

Analyze this incident and return ONLY valid JSON. No markdown, no code blocks.

Incident title: ${input.title}
Severity: ${input.severity}
Status: ${input.status}
Monitor name: ${input.monitorName || "Unknown"}
Monitor URL: ${input.monitorUrl || "Unknown"}
Last checked at: ${input.lastCheckedAt || "Unknown"}

Return JSON with exactly these fields:
{
  "rootCause": "short description of the most likely root cause",
  "reasoning": "explain why you think this is the cause",
  "recommendation": "numbered list of recommended actions"
}`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are an expert DevOps AI assistant. Always respond with valid JSON only. No markdown.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content || "{}";
  const parsed = safeParseJson(content);

  return {
    rootCause: String(parsed.rootCause || "Unable to determine root cause."),
    reasoning: String(parsed.reasoning || "No detailed reasoning provided."),
    recommendation: String(
      parsed.recommendation || "Check service logs and restart the service."
    ),
  };
}

export async function analyzeIncident(input: AiIncidentInput): Promise<{
  analysis: AiIncidentOutput;
  model: string;
}> {
  const provider = process.env.AI_PROVIDER || "gemini";

  try {
    if (provider === "openai" && process.env.OPENAI_API_KEY) {
      const analysis = await analyzeWithOpenAI(input);
      return { analysis, model: "gpt-4o-mini" };
    }

    if (process.env.GEMINI_API_KEY) {
      const analysis = await analyzeWithGemini(input);
      return { analysis, model: "gemini-2.0-flash" };
    }

    return {
      analysis: mockAnalysis(input),
      model: "mock",
    };
  } catch (error) {
    console.error("AI analysis failed:", error);

    return {
      analysis: mockAnalysis(input),
      model: "mock-fallback",
    };
  }
}