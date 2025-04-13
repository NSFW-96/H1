'use client'; // Required for useState, useEffect, event handlers

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config'; 
import { firestore } from '@/lib/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import { 
    Mail, 
    Lock, 
    Eye, 
    EyeOff, 
    AlertCircle, 
    ArrowRight, 
    Loader2,
    User,
    Check,
    X
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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

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

// Password strength calculation
const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 25;
    
    // Character checks
    if (/[A-Z]/.test(password)) strength += 25; // Uppercase
    if (/[a-z]/.test(password)) strength += 25; // Lowercase
    if (/[0-9]/.test(password)) strength += 25; // Numbers
    if (/[^A-Za-z0-9]/.test(password)) strength += 25; // Special characters
    
    return Math.min(100, strength);
};

export default function SignupPage() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoadingEmail, setIsLoadingEmail] = useState(false);
    const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
    const router = useRouter();

    // Update password strength when password changes
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        setPasswordStrength(calculatePasswordStrength(newPassword));
    };

    const getPasswordStrengthText = () => {
        if (passwordStrength === 0) return "";
        if (passwordStrength <= 25) return "Weak";
        if (passwordStrength <= 50) return "Fair";
        if (passwordStrength <= 75) return "Good";
        return "Strong";
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength <= 25) return "bg-red-500";
        if (passwordStrength <= 50) return "bg-yellow-500";
        if (passwordStrength <= 75) return "bg-blue-500";
        return "bg-green-500";
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        // Validation
        if (!firstName || !lastName || !email || !password) {
            setError("Please fill in all required fields");
            return;
        }
        
        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }
        
        if (passwordStrength < 50) {
            setError("Please choose a stronger password");
            return;
        }
        
        if (!agreeTerms) {
            setError("You must agree to the Terms of Service");
            return;
        }
        
        setIsLoadingEmail(true);

        try {
            // Create user with email/password
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Update profile with display name
            await updateProfile(user, {
                displayName: `${firstName} ${lastName}`
            });
            
            // Create user document in Firestore
            await setDoc(doc(firestore, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: `${firstName} ${lastName}`,
                firstName,
                lastName,
                createdAt: new Date(),
                photoURL: user.photoURL || '',
                lastLogin: new Date()
            });
            
            // Redirect to dashboard
            router.push('/dashboard');
        } catch (err: any) {
            console.error("Signup Error:", err);
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered. Try logging in instead.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password is too weak. Please choose a stronger password.');
            } else {
            setError(err.message || 'Failed to create account. Please try again.');
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
            const result = await signInWithPopup(auth, provider); 
            const user = result.user;
            
            // Check if this is a new user (created during this sign-in)
            const isNewUser = result.additionalUserInfo?.isNewUser;
            
            if (isNewUser && user) {
                // For new users, create a Firestore document
                const names = user.displayName ? user.displayName.split(' ') : ['', ''];
                const firstName = names[0] || '';
                const lastName = names.slice(1).join(' ') || '';
                
                await setDoc(doc(firestore, 'users', user.uid), {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    firstName,
                    lastName,
                    createdAt: new Date(),
                    photoURL: user.photoURL,
                    lastLogin: new Date()
                });
            }
            
            // Redirect to dashboard
            router.push('/dashboard'); 
        } catch (err: any) {
            console.error("Google Sign-In/Up Error:", err);
            if (err.code === 'auth/popup-closed-by-user') {
                setError('Sign up was cancelled. Please try again.');
            } else {
            setError(err.message || 'Failed to sign in/up with Google. Please try again.');
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
                        Join Vitraya Today
                    </motion.h1>
                    <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="text-lg opacity-90"
                    >
                        Start your journey to better health with personalized care
                    </motion.p>
                    
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        className="mt-12 grid grid-cols-1 gap-6 text-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-white bg-opacity-20 p-2 rounded-full">
                                <Check className="h-4 w-4" />
                            </div>
                            <p className="text-left">Free personalized health assessment</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white bg-opacity-20 p-2 rounded-full">
                                <Check className="h-4 w-4" />
                            </div>
                            <p className="text-left">Daily health tracking and insights</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white bg-opacity-20 p-2 rounded-full">
                                <Check className="h-4 w-4" />
                            </div>
                            <p className="text-left">AI-powered health recommendations</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white bg-opacity-20 p-2 rounded-full">
                                <Check className="h-4 w-4" />
                            </div>
                            <p className="text-left">Connect with healthcare professionals</p>
                        </div>
                    </motion.div>
                </div>
            </div>
            
            {/* Right side - Signup Form */}
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
                            <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
                            <CardDescription className="text-center">
                                Enter your information to join Vitraya
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
                            
                            <form onSubmit={handleSignup} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <Input 
                                                id="firstName" 
                                                placeholder="First Name"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                className="pl-10"
                                                required 
                                                disabled={isLoadingEmail || isLoadingGoogle}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input 
                                            id="lastName" 
                                            placeholder="Last Name"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            required 
                                            disabled={isLoadingEmail || isLoadingGoogle}
                                        />
                                    </div>
                                </div>
                                
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
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input 
                            id="password"
                                            type={showPassword ? "text" : "password"}
                            value={password}
                                            onChange={handlePasswordChange}
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
                                    
                                    {/* Password strength meter */}
                                    {password && (
                                        <div className="mt-2 space-y-1">
                                            <div className="flex justify-between items-center text-xs">
                                                <span>Password strength:</span>
                                                <span className={
                                                    passwordStrength <= 25 ? "text-red-500" :
                                                    passwordStrength <= 50 ? "text-yellow-500" :
                                                    passwordStrength <= 75 ? "text-blue-500" : "text-green-500"
                                                }>
                                                    {getPasswordStrengthText()}
                                                </span>
                                            </div>
                                            <Progress value={passwordStrength} className="h-1.5" 
                                                      indicatorClassName={getPasswordStrengthColor()} />
                                            <ul className="text-xs space-y-1 mt-1 text-gray-500">
                                                <li className="flex items-center">
                                                    {/[A-Z]/.test(password) ? (
                                                        <Check className="h-3 w-3 text-green-500 mr-1" />
                                                    ) : (
                                                        <X className="h-3 w-3 text-gray-300 mr-1" />
                                                    )}
                                                    Uppercase letter
                                                </li>
                                                <li className="flex items-center">
                                                    {/[a-z]/.test(password) ? (
                                                        <Check className="h-3 w-3 text-green-500 mr-1" />
                                                    ) : (
                                                        <X className="h-3 w-3 text-gray-300 mr-1" />
                                                    )}
                                                    Lowercase letter
                                                </li>
                                                <li className="flex items-center">
                                                    {/[0-9]/.test(password) ? (
                                                        <Check className="h-3 w-3 text-green-500 mr-1" />
                                                    ) : (
                                                        <X className="h-3 w-3 text-gray-300 mr-1" />
                                                    )}
                                                    Number
                                                </li>
                                                <li className="flex items-center">
                                                    {password.length >= 8 ? (
                                                        <Check className="h-3 w-3 text-green-500 mr-1" />
                                                    ) : (
                                                        <X className="h-3 w-3 text-gray-300 mr-1" />
                                                    )}
                                                    At least 8 characters
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input 
                                        id="confirmPassword" 
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                                        disabled={isLoadingEmail || isLoadingGoogle}
                                        className={confirmPassword && password !== confirmPassword ? "border-red-500" : ""}
                                    />
                                    {confirmPassword && password !== confirmPassword && (
                                        <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                                    )}
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="terms" 
                                        checked={agreeTerms}
                                        onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                                    />
                                    <label
                                        htmlFor="terms"
                                        className="text-sm text-gray-600 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        I agree to the{" "}
                                        <Link href="/terms" className="text-blue-600 hover:underline">
                                            Terms of Service
                                        </Link>
                                        {" "}and{" "}
                                        <Link href="/privacy" className="text-blue-600 hover:underline">
                                            Privacy Policy
                                        </Link>
                                    </label>
                    </div>
                                
                                <Button 
                        type="submit"
                                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700" 
                                    disabled={isLoadingEmail || isLoadingGoogle}
                                >
                                    {isLoadingEmail ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Creating account...
                                        </>
                                    ) : (
                                        <>
                                            Create Account
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
                                Already have an account?{" "}
                                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                                    Sign In
                    </Link>
                </p>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
} 