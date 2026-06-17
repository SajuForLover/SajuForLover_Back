import { OpenRouter } from '@openrouter/sdk';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractText(result: any): string {
  const content = result?.choices?.[0]?.message?.content;
  return typeof content === 'string' ? content : '';
}

export async function callOpenRouterText(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<string> {
  const client = new OpenRouter({ apiKey });
  const result = await client.chat.send({
    chatRequest: { model, messages: [{ role: 'user', content: prompt }] },
  });
  return extractText(result);
}

export async function callOpenRouterWithImage(
  apiKey: string,
  model: string,
  prompt: string,
  mimeType: string,
  base64Data: string,
): Promise<string> {
  const client = new OpenRouter({ apiKey });
  const result = await client.chat.send({
    chatRequest: {
      model,
      messages: [{
        role: 'user',
        content: [
          { type: 'text' as const, text: prompt },
          { type: 'image_url' as const, imageUrl: { url: `data:${mimeType};base64,${base64Data}` } },
        ],
      }],
    },
  });
  return extractText(result);
}
