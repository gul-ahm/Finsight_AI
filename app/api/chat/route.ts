import { NextResponse } from 'next/server';
import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 second timeout

export async function POST(request: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.error('[/api/chat] Groq API key is missing from environment variables');
      return NextResponse.json(
        { success: false, error: 'Groq API key is not configured on the server.' },
        { status: 500 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const { input, history = [], systemPrompt = '', temperature = 0.5 } = body;

    if (!input) {
      return NextResponse.json({ success: false, error: 'input field is required' }, { status: 400 });
    }

    console.log('[/api/chat] Initializing ChatGroq with model llama-3.3-70b-versatile');

    const llm = new ChatGroq({
      apiKey,
      model: 'llama-3.3-70b-versatile',
      temperature,
    });

    // Build messages array
    const messages: (SystemMessage | HumanMessage | AIMessage)[] = [];

    if (systemPrompt) {
      messages.push(new SystemMessage(systemPrompt));
    }

    // Add conversation history (limited to last 3 to avoid token overflow)
    const recentHistory = history.slice(-3);
    for (const msg of recentHistory) {
      if (msg.role === 'user') {
        messages.push(new HumanMessage(msg.content));
      } else if (msg.role === 'assistant') {
        messages.push(new AIMessage(msg.content));
      }
    }

    // Add current user message
    messages.push(new HumanMessage(input));

    console.log('[/api/chat] Sending', messages.length, 'messages to Groq');
    const response = await llm.invoke(messages);

    const content = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    console.log('[/api/chat] Got response, length:', content.length);
    return NextResponse.json({ success: true, content });

  } catch (error: any) {
    console.error('[/api/chat] Error:', error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}
