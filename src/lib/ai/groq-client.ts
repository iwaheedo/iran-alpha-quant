import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

let client: Groq | null = null;

function getClient(): Groq {
  if (!client) {
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured');
    }
    client = new Groq({ apiKey: GROQ_API_KEY });
  }
  return client;
}

export async function groqGenerate(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const groq = getClient();

  console.log('[Groq] Sending request (fallback)...');
  const startTime = Date.now();

  // Single attempt — no retries. The CDN will retry on the next cache cycle.
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 8192,
    response_format: { type: 'json_object' },
  });

  const text = completion.choices[0]?.message?.content;

  if (!text || text.trim().length === 0) {
    throw new Error('Empty response from Groq');
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Groq] Response received in ${elapsed}s (${text.length} chars)`);

  return text;
}

export function isGroqConfigured(): boolean {
  return !!GROQ_API_KEY;
}
