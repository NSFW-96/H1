'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { useChat, Message as VercelMessage } from 'ai/react';
import { Mic, CornerDownLeft, ThumbsDown, Clipboard, Loader2, Bot, User, RefreshCw, Clock, ArrowUpIcon, Send } from 'lucide-react';
import { ScrollArea } from "../../components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import Logo from '../../components/Logo';
import { TextShimmer } from '../../components/ui/text-shimmer';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { Input } from '../../components/ui/input';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

// Message type (local definition)
interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    feedback?: 'good' | 'bad' | null;
    timestamp?: Date;
}

// Auto-resize textarea hook
interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            // Temporarily shrink to get the right scrollHeight
            textarea.style.height = `${minHeight}px`;

            // Calculate new height
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        // Set initial height
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    // Adjust height on window resize
    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

// Text animation components with better fade and full text support
const TextAnimation = ({ text }: { text: string }) => {
  const words = text.split(' ');
  
  return (
    <span className="whitespace-pre-wrap">
      {words.map((word, i) => (
        <motion.span
          key={`word-${i}`}
          className="inline-block"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.2,
            delay: i * 0.02,  // Stagger the words
            ease: "easeOut"
          }}
        >
          {word}
          {i < words.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </span>
  );
};

// Special formatting for text that might contain line breaks, links, etc.
const FormattedTextAnimation = ({ text }: { text: string }) => {
  // Split the text by line breaks to handle multi-paragraph messages
  const paragraphs = text.split(/\n\n+/); // Split by multiple newlines
  
  return (
    <>
      {paragraphs.map((paragraph, i) => {
        const lines = paragraph.split(/\n/); // Split by single newlines within paragraphs
        
        return (
          <motion.div 
            key={`p-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ 
              duration: 0.3,
              delay: i * 0.1  // Stagger paragraphs
            }}
            className={i < paragraphs.length - 1 ? "mb-4" : ""}
          >
            {lines.map((line, j) => (
              <motion.div 
                key={`line-${i}-${j}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ 
                  duration: 0.3,
                  delay: (i * 0.1) + (j * 0.05)  // Stagger lines within paragraphs
                }}
              >
                <TextAnimation text={line} />
              </motion.div>
            ))}
          </motion.div>
        );
      })}
    </>
  );
};

export default function AgentPage() {
    const { user, loading: authLoading } = useAuth();
    const [localMessages, setLocalMessages] = useState<Message[]>([{
        id: 'welcome-msg',
        role: 'system',
        content: "Hello! I&apos;m Vitraya, your AI Health Coach. How can I help you today?"
    }]);
    const [showWelcome, setShowWelcome] = useState(true);
    const [input, setInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    
    // Use the auto-resize textarea hook
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });

    // Use the imported Message type
    const { messages: vercelMessages, input: vercelInput, handleInputChange: vercelHandleInputChange, handleSubmit: vercelHandleSubmit, isLoading, error: vercelError, append, reload } = useChat({
        onFinish: () => {
            // Maybe handle finish
        },
        onError: (err) => {
            console.error("Chat error:", err);
            setError("Sorry, something went wrong. Please try again.");
        }
    });

    // Combine Vercel AI SDK messages with local messages for display
    useEffect(() => {
        // Map Vercel messages to our local Message format, adding default ID if missing
        const mappedVercelMessages: Message[] = vercelMessages.map((m, index) => ({
            id: m.id || `vercel-msg-${index}`,
            role: m.role,
            content: m.content,
            timestamp: m.createdAt || new Date()
        }));

        // Filter out the initial system message if it's duplicated from Vercel state
        const combined = [...mappedVercelMessages];
        if (!mappedVercelMessages.some(m => m.id === 'welcome-msg')) {
            combined.unshift({
                id: 'welcome-msg',
                role: 'system',
                content: "Hello! I'm Vitraya, your AI Health Coach. How can I help you today?"
            });
        }

        setLocalMessages(combined);
    }, [vercelMessages]);

    // Scroll to bottom of messages when they change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [localMessages]);

    // Focus textarea field after loading
    useEffect(() => {
        if (!isLoading && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isLoading]);

    const handleUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim()) return;

        const newUserMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input,
            timestamp: new Date()
        };
        setLocalMessages(prev => [...prev, newUserMessage]);

        // Call the Vercel AI hook's handleSubmit
        vercelHandleSubmit(e); 
        // Or use append: append({ role: 'user', content: input });

        setInput(''); // Clear input after sending
    };

    const handleFeedback = (messageId: string, feedback: 'good' | 'bad') => {
        setLocalMessages(prev => prev.map(msg =>
            msg.id === messageId ? { ...msg, feedback: feedback } : msg
        ));
        // TODO: Send feedback to backend/analytics
        console.log(`Feedback for message ${messageId}: ${feedback}`);
    };

    const handleRetry = () => {
        reload(); // Use the reload function from useChat
        setError(null); // Clear previous error
    };

    const formatTime = (date?: Date) => {
        if (!date) return '';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Function to toggle sidebar on mobile
    const toggleSidebar = () => {
        document.documentElement.classList.toggle('sidebar-open');
    };

    // Loading state
    if (authLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="relative w-20 h-20 mb-4">
                        <Logo size={80} />
                        <Bot className="w-8 h-8 text-blue-600 absolute bottom-0 right-0" />
                    </div>
                    <p className="text-xl font-medium text-gray-700">Loading your Vitraya Coach...</p>
                </div>
            </div>
        );
    }

    // Auth required state
    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
                <Card className="w-full max-w-md shadow-lg border-0">
                    <CardHeader className="pb-4">
                        <div className="flex justify-center mb-4">
                            <div className="relative w-16 h-16">
                                <Logo size={64} />
                                <Bot className="w-6 h-6 text-blue-600 absolute bottom-0 right-0" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl text-center">Vitraya Health Coach</CardTitle>
                        <CardDescription className="text-center text-base">
                            Your personal guide to a healthier lifestyle
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center pb-4">
                        <p className="mb-4">Please log in to chat with your Vitraya Coach</p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                            <a href="/login">Go to Login</a>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <header className="flex items-center justify-between py-4 px-6 border-b">
                {/* Mobile menu toggle - only visible on small screens */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={toggleSidebar}
                        className="md:hidden mr-2 p-2 rounded-md text-gray-500 hover:bg-gray-100"
                        aria-label="Toggle menu"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                    
                    <div className="relative">
                        <Logo size={32} />
                        <Bot className="h-4 w-4 text-blue-600 absolute bottom-0 right-0" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-800">Vitraya Health Coach</h1>
                        <p className="text-sm text-gray-500">Your personal wellness guide</p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handleRetry}
                        title="Retry"
                        className="h-9 w-9 rounded-full"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </header>
            
            {/* Chat container */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {/* Messages container */}
                <div 
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-blue-50/30 to-transparent"
                    ref={messagesContainerRef}
                >
                    {showWelcome && localMessages.length === 1 && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center justify-center h-full text-center space-y-4"
                        >
                            <div className="relative w-20 h-20">
                                <Logo size={80} />
                                <Bot className="w-8 h-8 text-blue-600 absolute bottom-0 right-0" />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-800">Welcome to Vitraya Health Coach</h2>
                            <p className="text-gray-600 max-w-md">
                                I&apos;m here to help you with wellness tips, nutrition advice, exercise ideas, 
                                sleep improvement, and stress management strategies.
                            </p>
                            <div className="grid grid-cols-2 gap-2 mt-4 w-full max-w-sm">
                                <Button 
                                    variant="outline" 
                                    className="w-full"
                                    onClick={() => {
                                        setInput("How can I improve my sleep quality?");
                                        textareaRef.current?.focus();
                                    }}
                                >
                                    Sleep tips
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="w-full"
                                    onClick={() => {
                                        setInput("What are some quick healthy breakfast ideas?");
                                        textareaRef.current?.focus();
                                    }}
                                >
                                    Healthy meals
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="w-full"
                                    onClick={() => {
                                        setInput("Give me some 5-minute stress relief exercises");
                                        textareaRef.current?.focus();
                                    }}
                                >
                                    Stress relief
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="w-full"
                                    onClick={() => {
                                        setInput("What are some easy exercises I can do at home?");
                                        textareaRef.current?.focus();
                                    }}
                                >
                                    Home workouts
                                </Button>
                            </div>
                        </motion.div>
                    )}
                    
                    <AnimatePresence>
                        {!showWelcome && localMessages.filter(m => m.role !== 'system').map((message, index) => (
                            <motion.div 
                                key={message.id}
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.4 }}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div 
                                    className={`max-w-[80%] rounded-2xl p-4 ${
                                        message.role === 'user' 
                                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white ml-12' 
                                            : 'bg-white shadow-sm border border-gray-100 mr-12'
                                    }`}
                                >
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-start gap-3">
                                            <div className={`${message.role === 'user' ? 'order-last' : 'order-first'}`}>
                                                {message.role === 'user' 
                                                    ? <div className="flex justify-center items-center h-8 w-8 rounded-full bg-blue-700 text-white">
                                                        <User className="h-4 w-4" />
                                                      </div>
                                                    : <div className="flex justify-center items-center h-8 w-8 rounded-full bg-blue-100 text-blue-600">
                                                        <Bot className="h-4 w-4" />
                                                      </div>
                                                }
                                            </div>
                                            <div className="flex-1 whitespace-pre-wrap">
                                                {message.role === 'assistant' ? (
                                                    <FormattedTextAnimation text={message.content} />
                                                ) : (
                                                    message.content
                                                )}
                                            </div>
                                        </div>
                                        {message.timestamp && (
                                            <div className={`flex text-xs ${message.role === 'user' ? 'justify-start text-blue-200' : 'justify-end text-gray-400'} items-center gap-1`}>
                                                <Clock className="h-3 w-3" />
                                                <span>{formatTime(message.timestamp)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    
                    {isLoading && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start"
                        >
                            <div className="max-w-[80%] rounded-2xl p-4 bg-white shadow-sm border border-gray-100 mr-12">
                                <div className="flex items-center gap-3">
                                    <div className="flex justify-center items-center h-8 w-8 rounded-full bg-blue-100 text-blue-600">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                    <TextShimmer
                                        duration={1.5}
                                        className="text-base font-medium [--base-color:theme(colors.blue.600)] [--base-gradient-color:theme(colors.blue.200)] dark:[--base-color:theme(colors.blue.700)] dark:[--base-gradient-color:theme(colors.blue.400)]"
                                    >
                                        Vitraya Health Coach is thinking...
                                    </TextShimmer>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                {/* Input form with VercelV0Chat style */}
                <div className="p-4 bg-white border-t">
                    <div className="relative bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 w-full max-w-4xl mx-auto">
                        <div className="overflow-y-auto">
                            <Textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    adjustHeight();
                                }}
                                onKeyDown={handleUserSubmit}
                                placeholder="Ask your Vitraya Coach anything..."
                                disabled={isLoading}
                                className={cn(
                                    "w-full px-4 py-3",
                                    "resize-none",
                                    "bg-transparent",
                                    "border-none",
                                    "text-gray-800 text-sm",
                                    "focus:outline-none",
                                    "focus-visible:ring-0 focus-visible:ring-offset-0",
                                    "placeholder:text-blue-400 placeholder:text-sm",
                                    "min-h-[60px]"
                                )}
                                style={{
                                    overflow: "hidden",
                                }}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-2">
                                {/* Attachment button removed */}
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Suggestion button removed */}
                                <button
                                    type="button"
                                    onClick={handleUserSubmit}
                                    disabled={isLoading || !input.trim()}
                                    className={cn(
                                        "p-2 rounded-lg text-sm transition-colors border flex items-center justify-between",
                                        input.trim()
                                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-600"
                                            : "text-blue-300 border-blue-200"
                                    )}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <ArrowUpIcon
                                            className={cn(
                                                "w-5 h-5",
                                                input.trim()
                                                    ? "text-white"
                                                    : "text-blue-300"
                                            )}
                                        />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 