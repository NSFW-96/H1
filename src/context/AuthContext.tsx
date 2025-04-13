'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User, getIdToken } from 'firebase/auth';
import { auth } from '@/lib/firebase/config'; // Adjust path as necessary

interface AuthContextType {
    user: User | null;
    loading: boolean;
}

// Explicitly initialize context with default values matching the type
const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Listen for authentication state changes
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // User is signed in
                try {
                    // Get the ID token to create session cookie
                    const idToken = await getIdToken(currentUser, true);
                    
                    // Create a session on the server
                    const response = await fetch('/api/auth/session', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ idToken }),
                    });

                    if (!response.ok) {
                        console.error('Failed to create session:', await response.json());
                    } else {
                        console.log('Session created successfully');
                    }
                } catch (error) {
                    console.error('Error creating session:', error);
                }
            }
            
            setUser(currentUser);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 