import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const client = new OpenAI({
  baseURL: "https://api.studio.nebius.com/v1/",
  apiKey: process.env.NEBIUS_API_KEY,
});

// Define the system message
const SYSTEM_MESSAGE = `You are Vitraya Coach 🤖. Give friendly, simple tips on preventive health: healthy food 🍎, moving your body 🏃‍♂️, good sleep 😴, and less stress 🧘. Use helpful emojis. without any bold character`;

export async function POST(request: NextRequest) {
  try {
    console.log("Test chat API called");
    
    // Parse the request body
    const { messages } = await request.json();
    console.log("Received messages:", messages.length);

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages are required and must be an array' },
        { status: 400 }
      );
    }

    // Prepare messages for the OpenAI API, including the system message
    const apiMessages = [
      { role: 'system', content: SYSTEM_MESSAGE },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    console.log("Calling Nebius API...");
    console.log("API Key present:", !!process.env.NEBIUS_API_KEY);
    
    try {
      // Call the OpenAI API
      const response = await client.chat.completions.create({
        model: "microsoft/phi-4",
        messages: apiMessages,
        max_tokens: 8192,
        temperature: 0,
        top_p: 0.95,
      });

      console.log("API response received");
      
      // Extract and return the assistant's message
      const assistantMessage = response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
      return NextResponse.json({ message: assistantMessage });
    } catch (apiError: any) {
      console.error("API Error:", apiError);
      return NextResponse.json({ error: apiError.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in test chat API:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during the request' },
      { status: 500 }
    );
  }
} 