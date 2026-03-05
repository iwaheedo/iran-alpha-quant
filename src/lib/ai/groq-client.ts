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

async function callWithRetry(
  systemPrompt: string,
  userPrompt: string,
  maxRetries = 3
): Promise<string> {
  const groq = getClient();

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
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

      return text;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      // Rate limit
      if (message.includes('429') || message.includes('rate_limit')) {
        const delay = Math.pow(2, attempt + 1) * 2000;
        console.warn(`[Groq] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`[Groq] Error: ${message}, retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw err;
    }
  }

  throw new Error('Groq: max retries exceeded');
}

export async function groqGenerate(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  console.log('[Groq] Sending request (fallback)...');
  const startTime = Date.now();

  const result = await callWithRetry(systemPrompt, userPrompt);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Groq] Response received in ${elapsed}s (${result.length} chars)`);

  return result;
}

export function isGroqConfigured(): boolean {
  return !!GROQ_API_KEY;
}
