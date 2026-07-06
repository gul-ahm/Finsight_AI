// Client-side chat helper — calls /api/chat directly (no server action).
// Works on all hosting platforms including AWS Amplify.
export async function generateChatResponse(
  input: string,
  history: { role: string; content: string }[],
  systemPrompt: string,
  temperature: number = 0.5
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, history, systemPrompt, temperature }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || `Server error ${response.status}`);
    }

    return { success: true, content: data.content };
  } catch (error: any) {
    console.error('[generateChatResponse] Error:', error?.message || error);
    return { success: false, error: error?.message || 'Failed to generate response' };
  }
}
