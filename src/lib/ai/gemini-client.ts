import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
}

async function callWithRetry(
  systemPrompt: string,
  userPrompt: string,
  maxRetries = 2
): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.7,
      responseMimeType: 'application/json',
      maxOutputTokens: 65536,
    },
  });

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent({
        systemInstruction: systemPrompt,
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      });

      const response = result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini');
      }

      return text;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      // Rate limit — exponential backoff
      if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
        const delay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s
        console.warn(`[Gemini] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Other errors — retry with backoff
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`[Gemini] Error: ${message}, retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw err;
    }
  }

  throw new Error('Gemini: max retries exceeded');
}

export async function geminiGenerate(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  console.log('[Gemini] Sending request...');
  const startTime = Date.now();

  const result = await callWithRetry(systemPrompt, userPrompt);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Gemini] Response received in ${elapsed}s (${result.length} chars)`);

  return result;
}

export function isGeminiConfigured(): boolean {
  return !!GEMINI_API_KEY;
}
