"use server";

import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";

export async function generateChatResponse(
  input: string,
  history: { role: string; content: string }[],
  systemPrompt: string,
  temperature: number = 0.5
) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("Groq API key is not configured.");
    }

    const llm = new ChatGroq({
      apiKey,
      model: "llama-3.3-70b-versatile",
      temperature,
    });

    const formattedHistory = history.map(msg => 
      msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
    );

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"]
    ]);

    const chain = prompt.pipe(llm);
    
    const response = await chain.invoke({ 
      input,
      chat_history: formattedHistory
    });
    
    return { success: true, content: response.content as string };
  } catch (error: any) {
    console.error("Server Action LLM Error:", error);
    return { success: false, error: error.message || "Failed to generate response" };
  }
}
