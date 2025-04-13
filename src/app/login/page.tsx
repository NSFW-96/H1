'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup 
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import { 
    Mail, 
    Lock, 
    Eye, 
    EyeOff, 
    AlertCircle, 
    ArrowRight, 
    Loader2
} from 'lucide-react';

// Shadcn UI Imports
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Google Icon Component
const GoogleIcon = () => (
    <svg className="w-4 h-4 mr-2" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
      <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
);

// Animation variants
const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.4 }
    }
};

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoadingEmail, setIsLoadingEmail] = useState(false);
    const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!email || !password) {
            setError("Please fill in all fields");
            return;
        }
        
        setError(null);
        setIsLoadingEmail(true);

        try {
            // Sign in with email/password
            await signInWithEmailAndPassword(auth, email, password);
            
            // Redirect to dashboard
            router.push('/dashboard');
        } catch (err: any) {
            console.error("Email Login Error:", err);
            // Provide more user-friendly error messages
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('Invalid email or password. Please try again.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many failed login attempts. Please try again later or reset your password.');
            } else {
                setError(err.message || 'Failed to log in. Please check your credentials.');
            }
        } finally {
            setIsLoadingEmail(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        setIsLoadingGoogle(true);
        const provider = new GoogleAuthProvider();
        try {
            // Sign in with Google
            await signInWithPopup(auth, provider);
            
            // Redirect to dashboard
            router.push('/dashboard');
        } catch (err: any) {
            console.error("Google Sign-In Error:", err);
            if (err.code === 'auth/popup-closed-by-user') {
                setError('Sign in was cancelled. Please try again.');
            } else {
                setError(err.message || 'Failed to sign in with Google. Please try again.');
            }
        } finally {
            setIsLoadingGoogle(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            {/* Left side - Image/Branding */}
            <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-500 to-blue-700 p-12 items-center justify-center">
                <div className="max-w-md text-white text-center">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="mb-8 flex justify-center"
                    >
                        <div className="bg-white bg-opacity-20 p-5 rounded-full">
                            <Logo size={64} />
                        </div>
                    </motion.div>
                    <motion.h1 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="text-3xl font-bold mb-4"
                    >
                        Welcome to Vitraya
                    </motion.h1>
                    <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="text-lg opacity-90"
                    >
                        Your personalized health companion for a better, healthier life
                    </motion.p>
                    
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        className="mt-12 grid grid-cols-2 gap-6 text-sm"
                    >
                        <div className="text-left">
                            <div className="bg-white bg-opacity-20 h-1 w-8 rounded mb-3"></div>
                            <p>Track your health metrics and progress</p>
                        </div>
                        <div className="text-left">
                            <div className="bg-white bg-opacity-20 h-1 w-8 rounded mb-3"></div>
                            <p>Get personalized recommendations</p>
                        </div>
                        <div className="text-left">
                            <div className="bg-white bg-opacity-20 h-1 w-8 rounded mb-3"></div>
                            <p>Schedule appointments with doctors</p>
                        </div>
                        <div className="text-left">
                            <div className="bg-white bg-opacity-20 h-1 w-8 rounded mb-3"></div>
                            <p>Receive reminders for medications</p>
                        </div>
                    </motion.div>
                </div>
            </div>
            
            {/* Right side - Login Form */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-5 md:p-12">
                <motion.div 
                    className="w-full max-w-md"
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                >
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="space-y-1">
                            <div className="flex md:hidden mb-2 justify-center">
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <Logo size={32} />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
                            <CardDescription className="text-center">
                                Enter your credentials to access your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && (
                                <Alert variant="destructive" className="py-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="ml-2 text-sm">
                                        {error}
                                    </AlertDescription>
                                </Alert>
                            )}
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input 
                                            id="email" 
                                            type="email" 
                                            placeholder="your.email@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10"
                                            required 
                                            disabled={isLoadingEmail || isLoadingGoogle}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="password">Password</Label>
                                        <Link 
                                            href="/forgot-password" 
                                            className="text-xs text-blue-600 hover:text-blue-800"
                                        >
                                            Forgot Password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input 
                                            id="password" 
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 pr-10"
                                            required 
                                            disabled={isLoadingEmail || isLoadingGoogle}
                                        />
                                        <button 
                                            type="button"
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <Button 
                                    type="submit" 
                                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700" 
                                    disabled={isLoadingEmail || isLoadingGoogle}
                                >
                                    {isLoadingEmail ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            Sign In
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </form>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        Or continue with
                                    </span>
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                className="w-full" 
                                onClick={handleGoogleSignIn} 
                                disabled={isLoadingEmail || isLoadingGoogle}
                            >
                                {isLoadingGoogle ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <GoogleIcon />
                                )}
                                Google
                            </Button>
                        </CardContent>
                        <CardFooter className="flex justify-center border-t pt-5">
                            <p className="text-sm text-gray-600">
                                Don't have an account? {' '}
                                <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                                    Sign Up
                                </Link>
                            </p>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
} 