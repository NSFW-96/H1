import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import OpenAI from 'openai';

// Initialize Firebase Admin SDK for server-side auth verification if not already initialized
if (!admin.apps.length) {
  try {
    // Directly use the service account JSON object
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
      }),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

// Initialize OpenAI client
const client = new OpenAI({
  baseURL: "https://api.studio.nebius.com/v1/",
  apiKey: process.env.NEBIUS_API_KEY,
});

// Define the system message for the health assistant
const SYSTEM_MESSAGE = `You are Vitraya Health Coach, an AI wellness assistant designed to provide personalized healthcare guidance. 

YOUR CAPABILITIES:
- Offer evidence-based health recommendations across nutrition, fitness, sleep hygiene, and stress management
- Explain complex health concepts in simple, friendly language
- Personalize advice based on user's specific health conditions, goals, and preferences
- Maintain a positive, supportive tone that encourages sustainable lifestyle changes
- Use appropriate emojis to make interactions friendly and engaging

YOUR LIMITATIONS:
- You are not a replacement for professional medical care or diagnosis
- You cannot prescribe medication or replace a doctor's advice
- You should recommend consulting healthcare professionals for serious health concerns
- You should not make definitive claims about treatment outcomes

RESPONSE GUIDELINES:
- Keep responses concise but informative (2-4 paragraphs maximum)
- Use a friendly, conversational tone with appropriate emojis (🍎, 🏃‍♂️, 😴, 🧘, etc.)
- Structure responses with clear, readable formatting using numbers for lists
- Do NOT use asterisks (**) or markdown formatting for emphasis
- For emphasis, use emojis or simply capitalize important words
- Include practical, actionable advice users can implement immediately
- When appropriate, reference that the advice comes from Vitraya's health philosophy

Remember that your purpose is to support users on their health journey as part of the Vitraya wellness ecosystem. Always encourage positive health behaviors in an empathetic, non-judgmental way.`;

export async function POST(request: NextRequest) {
  try {
    // Get the session token from the cookies
    const sessionCookie = request.cookies.get('session')?.value;
    console.log('Session cookie present:', !!sessionCookie);

    // If no session cookie exists, return an unauthorized error
    if (!sessionCookie) {
      console.log('No session cookie found');
      return NextResponse.json(
        { error: 'Unauthorized - No session cookie' },
        { status: 401 }
      );
    }

    try {
      // Verify the session cookie and get the user
      console.log('Verifying session cookie...');
      const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie);
      console.log('Session verified for user:', decodedClaims.uid);
      // Session is valid, proceed
    } catch (error) {
      // Session is invalid
      console.error('Invalid session cookie:', error);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid session' },
        { status: 401 }
      );
    }

    // Parse the request body
    const { messages } = await request.json();

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

    // Call the OpenAI API
    const response = await client.chat.completions.create({
      model: "microsoft/phi-4",
      messages: apiMessages,
      max_tokens: 8192,
      temperature: 0,
      top_p: 0.95,
    });

    // Extract and return the assistant's message
    const assistantMessage = response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    return NextResponse.json({ message: assistantMessage });
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during the request' },
      { status: 500 }
    );
  }
} 