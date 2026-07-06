"use server";

// This server action delegates to /api/chat which is a standard Next.js API route.
// More reliable on AWS Amplify than calling Groq directly inside a server action.
export async function generateChatResponse(
  input: string,
  history: { role: string; content: string }[],
  systemPrompt: string,
  temperature: number = 0.5
) {
  try {
    // Determine the base URL for the internal API call
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://main.d1copg2plwr1d7.amplifyapp.com"
        : "http://localhost:3000");

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, history, systemPrompt, temperature }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      throw new Error(`/api/chat returned ${response.status}: ${errText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "API returned failure");
    }

    return { success: true, content: data.content as string };
  } catch (error: any) {
    console.error("generateChatResponse error:", error?.message || error);
    return { success: false, error: error?.message || "Failed to generate response" };
  }
}
