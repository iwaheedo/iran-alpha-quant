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

export async function geminiGenerate(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.7,
      responseMimeType: 'application/json',
      maxOutputTokens: 2000,
    },
  });

  console.log('[Gemini] Sending request...');
  const startTime = Date.now();

  // Single attempt — no retries. The CDN will retry on the next cache cycle.
  // Retries within the function risk exceeding the 60s serverless timeout.
  const result = await model.generateContent({
    systemInstruction: systemPrompt,
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
  });

  const response = result.response;
  const text = response.text();

  if (!text || text.trim().length === 0) {
    throw new Error('Empty response from Gemini');
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Gemini] Response received in ${elapsed}s (${text.length} chars)`);

  return text;
}

export function isGeminiConfigured(): boolean {
  return !!GEMINI_API_KEY;
}
