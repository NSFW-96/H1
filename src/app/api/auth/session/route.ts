import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
      }),
    });
    console.log('Firebase Admin initialized successfully in session API');
  } catch (error) {
    console.error('Firebase admin initialization error in session API:', error);
  }
}

// This endpoint creates a session cookie on the server when a user logs in
export async function POST(request: NextRequest) {
  try {
    console.log('Session API called');
    
    // Get the ID token passed by the client
    const body = await request.json();
    const { idToken } = body;
    
    console.log('ID token received:', !!idToken);
    
    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided' }, { status: 400 });
    }

    // Create a session cookie with Firebase Admin
    // Set session expiration to 5 days (in seconds)
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    
    console.log('Creating session cookie...');
    
    try {
      // Create the session cookie
      const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
      
      // Set the cookie in the response
      const response = NextResponse.json({ success: true });
      
      // Set cookie options
      response.cookies.set('session', sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'strict',
      });
      
      console.log('Session cookie created successfully');
      return response;
    } catch (cookieError) {
      console.error('Error creating session cookie:', cookieError);
      return NextResponse.json(
        { error: 'Failed to create session cookie' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Error in session API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create session' },
      { status: 500 }
    );
  }
} 