'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Send, Bot, User, Loader2 } from 'lucide-react';

// Message type
interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export default function ChatTestPage() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'system',
            content: "Welcome to Vitraya Coach 🤖! I can give you friendly tips on healthy eating 🍎, exercise 🏃‍♂️, sleep 😴, and stress management 🧘. How can I help you today?"
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom of messages when they change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            console.log("Sending request to chat-test API...");
            
            const response = await fetch('/api/chat-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [...messages.filter(m => m.role !== 'system'), userMessage],
                }),
            });

            console.log("API response status:", response.status);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("API error details:", errorData);
                throw new Error(`Failed to get response from AI: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [
                ...prev,
                { 
                    role: 'assistant', 
                    content: "I'm sorry, I'm having trouble processing your request right now. Please try again later."
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto">
            <Card className="flex flex-col h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-6 w-6 text-primary" />
                        Health AI Assistant (Test Mode)
                    </CardTitle>
                    <CardDescription>
                        This is a test chat that bypasses authentication. Ask me about general wellness, nutrition, exercise, sleep, or stress management.
                    </CardDescription>
                </CardHeader>
                
                {/* Messages container */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.filter(m => m.role !== 'system').map((message, index) => (
                        <div 
                            key={index} 
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div 
                                className={`max-w-[80%] rounded-lg p-3 ${
                                    message.role === 'user' 
                                        ? 'bg-primary text-primary-foreground ml-12' 
                                        : 'bg-muted mr-12'
                                }`}
                            >
                                <div className="flex items-start gap-2">
                                    <div className="mt-1">
                                        {message.role === 'user' 
                                            ? <User className="h-4 w-4" /> 
                                            : <Bot className="h-4 w-4" />
                                        }
                                    </div>
                                    <div className="whitespace-pre-wrap">{message.content}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-[80%] rounded-lg p-3 bg-muted mr-12">
                                <div className="flex items-center gap-2">
                                    <Bot className="h-4 w-4" />
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>
                
                {/* Input form */}
                <CardFooter className="border-t p-4">
                    <form onSubmit={handleSubmit} className="flex w-full gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about health and wellness..."
                            disabled={isLoading}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={isLoading || !input.trim()}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
} 