const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || '';
const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';

export async function cerebrasGenerate(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  console.log('[Cerebras] Sending request...');
  const startTime = Date.now();

  const response = await fetch(CEREBRAS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(55000),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`${response.status} ${errorBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text || text.trim().length === 0) {
    throw new Error('Empty response from Cerebras');
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Cerebras] Response received in ${elapsed}s (${text.length} chars)`);

  return text;
}

export function isCerebrasConfigured(): boolean {
  return !!CEREBRAS_API_KEY;
}
