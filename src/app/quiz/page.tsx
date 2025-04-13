'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
    motion, 
    AnimatePresence, 
    useAnimation, 
    useMotionValue, 
    useTransform,
    MotionValue
} from "framer-motion"; // Enhanced animation imports
import { Input } from "@/components/ui/input";

// --- Auth Context and Quiz Utils ---
import { useAuth } from '@/context/AuthContext'; // Import useAuth hook
import { saveQuizResults, updateQuizWithAIAnalysis, QuizAnswers, AIAnalysis } from '@/lib/quizUtils'; // Import saving functions and types
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert" // For displaying results
import { 
    Terminal, 
    ArrowRight, 
    ChevronRight, 
    Check, 
    Heart, 
    ActivitySquare, 
    Brain, 
    Apple, 
    Flame, 
    CheckCircle2, 
    HeartPulse,
    RefreshCw,
    BarChart4,
    MoonIcon,
    DropletIcon,
    ScaleIcon,
    RulerIcon,
    CalendarClockIcon,
    User,
    AlertTriangle,
    Lightbulb
} from "lucide-react"; // Additional icons

// System prompt for AI
const AI_SYSTEM_PROMPT = `
You are a health analysis AI expert. Based on the provided health assessment data, analyze the information and provide a structured response.
You MUST respond ONLY with the following JSON format, with no other text or explanation:

{
  "riskLevel": "Low|Moderate|High",
  "riskScore": <number between 0-100>,
  "recommendations": {
    "exercise": "<specific exercise recommendation based on activity level>",
    "nutrition": "<specific nutrition recommendation based on dietary habits>",
    "sleep": "<specific sleep recommendation based on sleep patterns>",
    "mentalHealth": "<specific mental health recommendation based on stress level>"
  },
  "healthInsights": {
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "areasForImprovement": ["<area 1>", "<area 2>", "<area 3>"],
    "longTermRisks": ["<risk 1>", "<risk 2>", "<risk 3>"]
  }
}

IMPORTANT: Do NOT use markdown formatting. Do NOT wrap the JSON in \`\`\` code blocks. Return ONLY the raw JSON object.

Base your analysis on these factors:
1. BMI and weight status
2. Physical activity frequency and intensity
3. Nutrition habits, especially fruits and vegetables intake
4. Sleep duration and quality
5. Smoking status
6. Stress levels
7. Age and gender

Ensure you provide personalized, actionable recommendations.
`;

// --- Health Calculation Utils ---
type HealthMetrics = {
    bmi: number;
    bmiCategory: string;
    idealWeightRange: { min: number; max: number };
    bmr: number; // Basal Metabolic Rate
    waterNeeded: number; // Daily water intake in liters
}

// Calculate BMI and related metrics
const calculateHealthMetrics = (
    heightCm: number,
    weightKg: number,
    age: number,
    gender: string,
    activityLevel: string
): HealthMetrics => {
    // Convert height to meters
    const heightM = heightCm / 100;
    
    // Calculate BMI
    const bmi = weightKg / (heightM * heightM);
    
    // Determine BMI category
    let bmiCategory = '';
    if (bmi < 18.5) bmiCategory = 'Underweight';
    else if (bmi >= 18.5 && bmi < 25) bmiCategory = 'Healthy Weight';
    else if (bmi >= 25 && bmi < 30) bmiCategory = 'Overweight';
    else bmiCategory = 'Obese';
    
    // Calculate ideal weight range based on healthy BMI (18.5-24.9)
    const minWeight = Math.round(18.5 * heightM * heightM);
    const maxWeight = Math.round(24.9 * heightM * heightM);
    
    // Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
    let bmr = 0;
    if (gender === 'male') {
        bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
    } else {
        bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
    }
    
    // Adjust BMR based on activity level
    const activityMultipliers: {[key: string]: number} = {
        'sedentary': 1.2, // Little or no exercise
        'light': 1.375,   // Light exercise 1-3 days/week
        'moderate': 1.55, // Moderate exercise 3-5 days/week
        'active': 1.725,  // Heavy exercise 6-7 days/week
        'very_active': 1.9 // Very heavy exercise, physical job or training twice a day
    };
    
    const activityMultiplier = activityMultipliers[activityLevel] || 1.2;
    bmr = Math.round(bmr * activityMultiplier);
    
    // Calculate recommended water intake in liters (weight in kg * 0.033)
    const waterNeeded = parseFloat((weightKg * 0.033).toFixed(1));
    
    return {
        bmi: parseFloat(bmi.toFixed(1)),
        bmiCategory,
        idealWeightRange: { min: minWeight, max: maxWeight },
        bmr: Math.round(bmr),
        waterNeeded
    };
};

// --- Sample Quiz Data ---
// TODO: Replace with actual questions, potentially fetched from a source
interface Question {
    id: number;
    text: string;
    category: string;
    icon: React.ReactNode;
    description?: string;
    type?: 'radio' | 'slider' | 'numeric'; // Added type for different question formats
    options: { value: string; label: string; description?: string }[];
    min?: number; // For numeric questions
    max?: number; // For numeric questions
    unit?: string; // For numeric questions
}

const sampleQuestions: Question[] = [
    {
        id: 1,
        text: "What is your age?",
        category: "Personal Info",
        icon: <CalendarClockIcon className="h-6 w-6 text-blue-500" />,
        description: "Your age helps us determine appropriate health recommendations",
        type: 'numeric',
        min: 18,
        max: 100,
        unit: 'years',
        options: [] // Empty for numeric type
    },
    {
        id: 2,
        text: "What is your gender?",
        category: "Personal Info", 
        icon: <User className="h-6 w-6 text-blue-500" />,
        options: [
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "other", label: "Other" },
            { value: "prefer_not_to_say", label: "Prefer not to say" }
        ]
    },
    {
        id: 3,
        text: "What is your height?",
        category: "Body Metrics",
        icon: <RulerIcon className="h-6 w-6 text-blue-500" />,
        description: "Used to calculate your BMI and other health metrics",
        type: 'numeric',
        min: 120,
        max: 220,
        unit: 'cm',
        options: [] // Empty for numeric type
    },
    {
        id: 4,
        text: "What is your weight?",
        category: "Body Metrics",
        icon: <ScaleIcon className="h-6 w-6 text-blue-500" />,
        description: "Used to calculate your BMI and other health metrics",
        type: 'numeric',
        min: 40,
        max: 200,
        unit: 'kg',
        options: [] // Empty for numeric type
    },
    {
        id: 5,
        text: "On average, how many days per week do you engage in moderate physical activity?",
        category: "Physical Activity",
        icon: <ActivitySquare className="h-6 w-6 text-orange-500" />,
        description: "Examples include brisk walking, cycling, or swimming for at least 30 minutes",
        options: [
            { value: "0-1", label: "0-1 days", description: "Rarely exercise" },
            { value: "2-3", label: "2-3 days", description: "Occasional exercise" },
            { value: "4-5", label: "4-5 days", description: "Regular exercise" },
            { value: "6-7", label: "6-7 days", description: "Daily exercise" },
        ],
    },
    {
        id: 6,
        text: "How would you rate your physical activity level?",
        category: "Physical Activity",
        icon: <ActivitySquare className="h-6 w-6 text-orange-500" />,
        options: [
            { value: "sedentary", label: "Sedentary", description: "Little to no exercise" },
            { value: "light", label: "Lightly Active", description: "Light exercise 1-3 days/week" },
            { value: "moderate", label: "Moderately Active", description: "Moderate exercise 3-5 days/week" },
            { value: "active", label: "Very Active", description: "Hard exercise 6-7 days/week" },
            { value: "very_active", label: "Extremely Active", description: "Very hard exercise & physical job or training twice a day" },
        ],
    },
    {
        id: 7,
        text: "How many servings of fruits and vegetables do you typically eat per day?",
        category: "Nutrition",
        icon: <Apple className="h-6 w-6 text-green-500" />,
        description: "A serving is about 1 cup of raw vegetables or 1 medium piece of fruit",
        options: [
            { value: "0-1", label: "0-1 servings", description: "Minimal produce" },
            { value: "2-3", label: "2-3 servings", description: "Some produce" },
            { value: "4-5", label: "4-5 servings", description: "Good amount" },
            { value: "5+", label: "5+ servings", description: "Excellent intake" },
        ],
    },
    {
        id: 8,
        text: "How much water do you typically drink per day?",
        category: "Nutrition",
        icon: <DropletIcon className="h-6 w-6 text-blue-500" />,
        description: "One glass is approximately 250ml",
        options: [
            { value: "0-2", label: "0-2 glasses", description: "Less than 500ml" },
            { value: "3-5", label: "3-5 glasses", description: "About 1 liter" },
            { value: "6-8", label: "6-8 glasses", description: "About 1.5-2 liters" },
            { value: "8+", label: "8+ glasses", description: "More than 2 liters" },
        ],
    },
    {
        id: 9,
        text: "How many hours of sleep do you usually get per night?",
        category: "Sleep",
        icon: <MoonIcon className="h-6 w-6 text-indigo-500" />,
        options: [
            { value: "less-than-5", label: "Less than 5 hours", description: "Very short sleep" },
            { value: "5-6", label: "5-6 hours", description: "Short sleep" },
            { value: "7-8", label: "7-8 hours", description: "Recommended amount" },
            { value: "9+", label: "More than 9 hours", description: "Long sleep" },
        ],
    },
    {
        id: 10,
        text: "Do you currently smoke tobacco products?",
        category: "Lifestyle",
        icon: <Flame className="h-6 w-6 text-red-500" />,
        options: [
            { value: "yes", label: "Yes", description: "Current smoker" },
            { value: "occasionally", label: "Occasionally", description: "Social smoker" },
            { value: "former", label: "Former smoker", description: "Quit smoking" },
            { value: "no", label: "No", description: "Never smoked" },
        ],
    },
    {
        id: 11,
        text: "How would you rate your typical stress level?",
        category: "Mental Health",
        icon: <Brain className="h-6 w-6 text-purple-500" />,
        description: "Consider your general feelings over the past month",
        options: [
            { value: "high", label: "High", description: "Frequently overwhelmed" },
            { value: "moderate", label: "Moderate", description: "Occasionally stressed" },
            { value: "low", label: "Low", description: "Generally relaxed" },
            { value: "minimal", label: "Minimal", description: "Rarely stressed" },
        ],
    },
];
// -----------------------

// Animation variants
const fadeIn = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1, 
        transition: { 
            duration: 0.6,
            ease: "easeOut" 
        } 
    },
    exit: { 
        opacity: 0, 
        transition: { 
            duration: 0.3,
            ease: "easeIn"
        } 
    }
};

const slideIn = {
    hidden: { 
        x: 40, 
        opacity: 0,
        scale: 0.98
    },
    visible: { 
        x: 0, 
        opacity: 1,
        scale: 1,
        transition: { 
            type: "spring",
            stiffness: 300,
            damping: 25,
            duration: 0.4
        } 
    },
    exit: { 
        x: -40, 
        opacity: 0,
        scale: 0.98,
        transition: { 
            duration: 0.3,
            ease: [0.43, 0.13, 0.23, 0.96]
        } 
    }
};

const popIn = {
    hidden: { 
        scale: 0.8, 
        opacity: 0,
        y: 20 
    },
    visible: { 
        scale: 1, 
        opacity: 1,
        y: 0,
        transition: { 
            type: "spring",
            stiffness: 400, 
            damping: 15,
            delay: 0.1
        } 
    },
    exit: { 
        scale: 0.8, 
        opacity: 0,
        transition: { 
            duration: 0.2 
        } 
    }
};

// Staggered children animation
const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariant = {
    hidden: { 
        y: 20, 
        opacity: 0 
    },
    visible: { 
        y: 0, 
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 20
        }
    }
};

// Progress indicator animation
const progressVariant = {
    initial: (custom: number) => ({
        width: `${custom}%`,
        transition: { duration: 0.7, ease: "easeInOut" }
    }),
    animate: (custom: number) => ({
        width: `${custom}%`,
        transition: { duration: 0.7, ease: "easeInOut" }
    })
};

export default function QuizPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    
    // States for quiz functionality
    const [currentQuestion, setCurrentQuestion] = useState(0);
    
    // Initialize with default answers for all questions
    const [answers, setAnswers] = useState<{[key: number]: string}>({
        // Personal Info
        1: '35', // Age
        2: 'male', // Gender
        // Body Metrics
        3: '175', // Height in cm
        4: '70', // Weight in kg
        // Physical Activity
        5: '2-3', // Days of moderate activity
        6: 'moderate', // Activity level
        // Nutrition
        7: '2-3', // Servings of fruits and vegetables
        8: '6-8', // Glasses of water
        // Sleep
        9: '7-8', // Hours of sleep
        // Lifestyle
        10: 'no', // Smoking status
        // Mental Health
        11: 'moderate' // Stress level
    });
    
    const [progress, setProgress] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    const controls = useAnimation();
    const progressValue = useMotionValue(progress);
    const progressOpacity = useTransform(progressValue, [0, 100], [0.5, 1]);
    
    // Animation for progress
    useEffect(() => {
        progressValue.set(progress);
    }, [progress, progressValue]);
    
    // Animation function for smooth progress update
    const animateProgress = () => {
        controls.start({
            width: `${progress}%`,
            transition: { duration: 0.5, ease: "easeInOut" }
        });
    };
    
    // Run animation when progress changes
    useEffect(() => {
        animateProgress();
    }, [progress]);
    
    // Set progress whenever current question changes
    useEffect(() => {
        const newProgress = ((currentQuestion + 1) / sampleQuestions.length) * 100;
        setProgress(newProgress);
    }, [currentQuestion]);
    
    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);
    
    // Handle radio answer selection
    const handleAnswerChange = (value: string) => {
        const newAnswers = { ...answers };
        newAnswers[sampleQuestions[currentQuestion].id] = value;
        setAnswers(newAnswers);
    };
    
    // Handle numeric input change
    const handleNumericChange = (value: string, questionId: number) => {
        if (value === '') {
            // If input is cleared, allow it
            const newAnswers = { ...answers };
            newAnswers[questionId] = '';
            setAnswers(newAnswers);
            return;
        }
        
        // Accept any numeric value without min/max restrictions
        const newAnswers = { ...answers };
        newAnswers[questionId] = value;
        setAnswers(newAnswers);
    };
    
    // Get height from answers
    const getHeight = () => {
        const heightQuestion = sampleQuestions.find(q => q.text.includes("height"));
        return heightQuestion && answers[heightQuestion.id] ? parseFloat(answers[heightQuestion.id]) : 0;
    };
    
    // Get weight from answers
    const getWeight = () => {
        const weightQuestion = sampleQuestions.find(q => q.text.includes("weight"));
        return weightQuestion && answers[weightQuestion.id] ? parseFloat(answers[weightQuestion.id]) : 0;
    };
    
    // Check if the current question has been answered
    const checkCurrentAnswer = () => {
        const currentQuestionId = sampleQuestions[currentQuestion].id;
        return answers[currentQuestionId] !== undefined && answers[currentQuestionId] !== '';
    };
    
    // Handle next question button
    const handleNext = () => {
        if (currentQuestion < sampleQuestions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            calculateResults();
            setShowResults(true);
        }
    };
    
    // Send the quiz data to our AI function for analysis
    const sendToAI = async (quizData: any): Promise<AIAnalysis> => {
        try {
            console.log("Sending quiz data to AI:", quizData);
            
            // Make real API call to our backend endpoint
            const response = await fetch('/api/analyze-health', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quizData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("AI Analysis API error:", errorData);
                throw new Error("Failed to get AI analysis: " + (errorData.error || response.statusText));
            }
            
            const data = await response.json();
            return data as AIAnalysis;
            
        } catch (error) {
            console.error("Error in AI analysis:", error);
            throw new Error("Failed to analyze health data. " + (error instanceof Error ? error.message : String(error)));
        }
    };
    
    // Calculate health metrics and prepare for results
    const calculateResults = () => {
        const height = getHeight();
        const weight = getWeight();
        
        // Get age
        const ageQuestion = sampleQuestions.find(q => q.text.includes("age"));
        const age = ageQuestion && answers[ageQuestion.id] ? parseInt(answers[ageQuestion.id]) : 30;
        
        // Get gender
        const genderQuestion = sampleQuestions.find(q => q.text.includes("gender"));
        const gender = genderQuestion && answers[genderQuestion.id] ? answers[genderQuestion.id] : "male";
        
        // Get activity level
        const activityQuestion = sampleQuestions.find(q => q.category === "Physical Activity");
        let activityLevel = "moderate";
        if (activityQuestion && answers[activityQuestion.id]) {
            const activity = answers[activityQuestion.id];
            if (activity === "0-1") activityLevel = "sedentary";
            else if (activity === "2-3") activityLevel = "light";
            else if (activity === "4-5") activityLevel = "moderate";
            else if (activity === "6-7") activityLevel = "active";
        }
        
        // Calculate health metrics
        if (height && weight) {
            // Ensure gender is always a string
            const safeGender = typeof gender === 'string' ? gender : 'male';
            const metrics = calculateHealthMetrics(height, weight, age, safeGender, activityLevel);
            setHealthMetrics(metrics);
        }
    };
    
    // Submit the completed quiz
    const handleSubmit = async () => {
        if (!user) return;
        
        try {
            setIsSubmitting(true);
            setError(null);
            
            // Calculate health metrics if not already done
            if (!healthMetrics) {
                calculateResults();
            }
            
            // Only proceed if we have health metrics
            if (healthMetrics) {
                // Create enhanced answer object with health metrics
                const enhancedAnswers: QuizAnswers = {
                    ...answers,
                    bmi: String(healthMetrics.bmi),
                    bmiCategory: healthMetrics.bmiCategory,
                    idealWeightMin: String(healthMetrics.idealWeightRange.min),
                    idealWeightMax: String(healthMetrics.idealWeightRange.max),
                    bmr: String(healthMetrics.bmr),
                    waterNeeded: String(healthMetrics.waterNeeded)
                };
                
                // Full data for AI analysis
                const combinedData = {
                    answers: enhancedAnswers,
                    completedAt: new Date(),
                    userId: user.uid,
                    ...healthMetrics
                };
                
                console.log("Saving quiz results:", combinedData);
                
                // Attempt to get AI analysis
                setIsAnalyzing(true);
                try {
                    const analysis = await sendToAI(combinedData);
                    setAiAnalysis(analysis);
                    
                    // Add AI analysis to the enhanced answers
                    enhancedAnswers.riskLevel = analysis.riskLevel;
                    enhancedAnswers.riskScore = analysis.riskScore;
                    enhancedAnswers.aiAnalyzed = true;
                    
                    // Save the quiz results to Firestore and get the quiz ID
                    const result = await saveQuizResults(user.uid, enhancedAnswers);
                    
                    // Save AI analysis separately using the returned quiz ID
                    if (result && result.quizId) {
                        await updateQuizWithAIAnalysis(user.uid, result.quizId, analysis);
                    } else {
                        console.error("No quiz ID returned from saveQuizResults");
                        setError("Health data saved, but AI analysis could not be attached.");
                    }
                    
                } catch (aiError) {
                    console.error("Error getting AI analysis:", aiError);
                    // Still save the quiz results even if AI analysis fails
                    await saveQuizResults(user.uid, enhancedAnswers);
                    setError("Health data saved, but AI analysis encountered an error. You can view your basic results.");
                } finally {
                    setIsAnalyzing(false);
                    // Ensure we move to results view regardless of AI analysis success
                    setShowResults(true);
                }
            } else {
                setError("Unable to calculate health metrics. Please check your height and weight inputs.");
            }
        } catch (err) {
            console.error("Error submitting quiz:", err);
            setError("There was a problem saving your results. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Option to retake the quiz
    const handleRetakeQuiz = () => {
        setCurrentQuestion(0);
        setAnswers({});
        setShowResults(false);
        setHealthMetrics(null);
        setAiAnalysis(null);
        setError(null);
    };
    
    // Render different input types based on question type
    const renderQuestionInput = () => {
        const question = sampleQuestions[currentQuestion];
        
        if (question.type === 'numeric') {
            const value = answers[question.id] || '';
            return (
                <div className="mt-4">
                    <div className="flex items-center space-x-2">
                        <Input
                            type="number"
                            value={value}
                            onChange={(e) => handleNumericChange(e.target.value, question.id)}
                            className="h-12 text-lg rounded-xl"
                            placeholder={`Enter your ${question.text.toLowerCase()}`}
                        />
                        {question.unit && (
                            <span className="text-gray-500 text-lg">{question.unit}</span>
                        )}
                    </div>
                    {question.min !== undefined && question.max !== undefined && (
                        <p className="text-xs text-gray-500 mt-1">
                            Suggested range: {question.min} - {question.max} {question.unit}
                        </p>
                    )}
                </div>
            );
        }
        
        // Default to radio options
        return (
            <RadioGroup
                value={answers[question.id] || ''}
                onValueChange={handleAnswerChange}
                className="mt-4 space-y-3"
            >
                {question.options.map((option) => (
                    <div key={option.value} className="transition-all duration-200 hover:bg-gray-50 rounded-xl p-3 -mx-3">
                        <div className="flex items-center space-x-3">
                            <RadioGroupItem 
                                value={option.value} 
                                id={`${question.id}-${option.value}`}
                                className="data-[state=checked]:border-blue-500 data-[state=checked]:text-blue-500"
                            />
                            <Label 
                                htmlFor={`${question.id}-${option.value}`}
                                className="font-medium text-gray-700 cursor-pointer flex-1"
                            >
                                {option.label}
                            </Label>
                        </div>
                        {option.description && (
                            <p className="text-sm text-gray-500 mt-1 ml-8">
                                {option.description}
                            </p>
                        )}
                    </div>
                ))}
            </RadioGroup>
        );
    };
    
    // Auth loading state
    if (authLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-3xl text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-xl font-medium text-gray-700">Loading...</p>
                </div>
            </div>
        );
    }
    
    // Show login required message if not logged in
    if (!user) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-lg border-0 rounded-3xl overflow-hidden">
                    <CardHeader className="pb-4 text-center">
                        <CardTitle className="text-2xl">Login Required</CardTitle>
                        <CardDescription>
                            Please login to access the health assessment
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center">
                        <Button 
                            onClick={() => router.push('/login')}
                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-8"
                        >
                            Go to Login
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }
    
    // Show results page
    if (showResults) {
        return (
            <div className="min-h-screen bg-white">
                <div className="container mx-auto py-10 px-4 max-w-6xl">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-8"
                    >
                        <h1 className="text-3xl font-bold text-blue-600 mb-2">Health Assessment Results</h1>
                        <p className="text-gray-600">
                            Your personalized health insights based on your responses
                        </p>
                    </motion.div>

                    {/* Results cards */}
                    <div className="grid gap-6 md:grid-cols-2 mb-8">
                        {/* Health Status */}
                        <Card className="shadow-md border-0 rounded-3xl overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <HeartPulse className="h-6 w-6 text-rose-500" />
                                    Health Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isAnalyzing ? (
                                    <div className="flex items-center space-x-3 py-4">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                        <p>Analyzing your health data...</p>
                                    </div>
                                ) : aiAnalysis ? (
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className={`py-1.5 px-4 rounded-full font-medium text-sm ${
                                                aiAnalysis.riskLevel === 'Low' ? 'bg-green-100 text-green-700' :
                                                aiAnalysis.riskLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {aiAnalysis.riskLevel} Risk
                                            </div>
                                            <div className="text-3xl font-bold text-gray-900">
                                                {aiAnalysis.riskScore}/100
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="font-medium text-gray-700 mb-2">Health Strengths</h4>
                                                <ul className="space-y-2">
                                                    {aiAnalysis.healthInsights.strengths.map((strength, index) => (
                                                        <li key={index} className="flex items-start gap-2 text-sm">
                                                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                            <span>{strength}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            
                                            <div>
                                                <h4 className="font-medium text-gray-700 mb-2">Areas for Improvement</h4>
                                                <ul className="space-y-2">
                                                    {aiAnalysis.healthInsights.areasForImprovement.map((area, index) => (
                                                        <li key={index} className="flex items-start gap-2 text-sm">
                                                            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                                            <span>{area}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                ) : error ? (
                                    <Alert className="border-red-200 bg-red-50">
                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                ) : (
                                    <div className="text-center py-6">
                                        <div className="mb-3">
                                            <RefreshCw className="h-10 w-10 text-blue-500 mx-auto animate-spin" />
                                        </div>
                                        <p>Preparing your results...</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Health Metrics Card */}
                        <Card className="shadow-md border-0 rounded-3xl overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <ActivitySquare className="h-6 w-6 text-blue-500" />
                                    Health Metrics
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {healthMetrics ? (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {/* BMI */}
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <User className="h-5 w-5 text-blue-500" />
                                                <h4 className="font-medium text-gray-700">BMI</h4>
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900 mb-1">
                                                {healthMetrics.bmi}
                                            </div>
                                            <div className={`text-sm font-medium px-2 py-0.5 rounded-full inline-block ${
                                                healthMetrics.bmiCategory === 'Healthy Weight' ? 'bg-green-100 text-green-700' :
                                                healthMetrics.bmiCategory === 'Underweight' ? 'bg-blue-100 text-blue-700' :
                                                healthMetrics.bmiCategory === 'Overweight' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {healthMetrics.bmiCategory}
                                            </div>
                                        </div>
                                        
                                        {/* Daily Calories */}
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Flame className="h-5 w-5 text-orange-500" />
                                                <h4 className="font-medium text-gray-700">Daily Calories</h4>
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900 mb-1">
                                                {healthMetrics.bmr}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Recommended daily intake
                                            </div>
                                        </div>
                                        
                                        {/* Ideal Weight Range */}
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <ActivitySquare className="h-5 w-5 text-green-500" />
                                                <h4 className="font-medium text-gray-700">Ideal Weight</h4>
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900 mb-1">
                                                {healthMetrics.idealWeightRange.min} - {healthMetrics.idealWeightRange.max} kg
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Healthy weight range
                                            </div>
                                        </div>
                                        
                                        {/* Water Intake */}
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <DropletIcon className="h-5 w-5 text-blue-500" />
                                                <h4 className="font-medium text-gray-700">Water Intake</h4>
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900 mb-1">
                                                {healthMetrics.waterNeeded}L
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Recommended daily intake
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <p>Unable to calculate health metrics.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recommendations Section */}
                    {aiAnalysis && (
                        <Card className="shadow-md border-0 rounded-3xl overflow-hidden mb-8">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Lightbulb className="h-6 w-6 text-amber-500" />
                                    Personalized Recommendations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {/* Exercise */}
                                    <div className="bg-blue-50 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ActivitySquare className="h-5 w-5 text-blue-600" />
                                            <h4 className="font-medium text-blue-900">Exercise</h4>
                                        </div>
                                        <p className="text-sm text-blue-700">{aiAnalysis.recommendations.exercise}</p>
                                    </div>
                                    
                                    {/* Nutrition */}
                                    <div className="bg-green-50 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Apple className="h-5 w-5 text-green-600" />
                                            <h4 className="font-medium text-green-900">Nutrition</h4>
                                        </div>
                                        <p className="text-sm text-green-700">{aiAnalysis.recommendations.nutrition}</p>
                                    </div>
                                    
                                    {/* Sleep */}
                                    <div className="bg-indigo-50 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MoonIcon className="h-5 w-5 text-indigo-600" />
                                            <h4 className="font-medium text-indigo-900">Sleep</h4>
                                        </div>
                                        <p className="text-sm text-indigo-700">{aiAnalysis.recommendations.sleep}</p>
                                    </div>
                                    
                                    {/* Mental Health */}
                                    <div className="bg-purple-50 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Brain className="h-5 w-5 text-purple-600" />
                                            <h4 className="font-medium text-purple-900">Mental Health</h4>
                                        </div>
                                        <p className="text-sm text-purple-700">{aiAnalysis.recommendations.mentalHealth}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                        <Button
                            onClick={handleRetakeQuiz}
                            variant="outline"
                            className="rounded-full px-8 border-blue-500 text-blue-600 hover:bg-blue-50"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retake Assessment
                        </Button>
                        
                        <Button
                            onClick={() => router.push('/dashboard')}
                            className="rounded-full px-8 bg-blue-500 hover:bg-blue-600"
                        >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Go to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
    
    // Show quiz interface
    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto py-10 px-4 max-w-3xl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-3xl font-bold text-blue-600 mb-2">Health Assessment</h1>
                    <p className="text-gray-600">
                        Complete this assessment to get personalized health insights
                    </p>
                </motion.div>

                {/* Progress bar */}
                <motion.div 
                    className="w-full h-2 bg-blue-100 rounded-full mb-8 overflow-hidden"
                    style={{ opacity: progressOpacity }}
                >
                    <motion.div 
                        className="h-full bg-blue-500 rounded-full"
                        animate={controls}
                        style={{ width: `${progress}%` }}
                    />
                </motion.div>
                
                {/* Question card */}
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={currentQuestion}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="shadow-md border-0 rounded-3xl overflow-hidden">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-blue-100 rounded-full p-2 text-blue-600">
                                        {sampleQuestions[currentQuestion].icon}
                                    </div>
                                    <div className="text-sm font-medium text-blue-600">
                                        {sampleQuestions[currentQuestion].category}
                                    </div>
                                </div>
                                <CardTitle className="text-xl text-gray-800">
                                    {sampleQuestions[currentQuestion].text}
                                </CardTitle>
                                {sampleQuestions[currentQuestion].description && (
                                    <CardDescription className="text-gray-500 mt-1">
                                        {sampleQuestions[currentQuestion].description}
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent>
                                {renderQuestionInput()}
                            </CardContent>
                            <CardFooter className="flex justify-between pt-4 border-t">
                                <Button 
                                    variant="outline" 
                                    onClick={() => currentQuestion > 0 && setCurrentQuestion(currentQuestion - 1)}
                                    disabled={currentQuestion === 0}
                                    className="rounded-full px-5"
                                >
                                    Back
                                </Button>
                                <Button 
                                    onClick={currentQuestion < sampleQuestions.length - 1 ? handleNext : handleSubmit}
                                    disabled={!checkCurrentAnswer() || isSubmitting}
                                    className={`rounded-full px-6 ${
                                        currentQuestion === sampleQuestions.length - 1 
                                            ? 'bg-green-500 hover:bg-green-600' 
                                            : 'bg-blue-500 hover:bg-blue-600'
                                    }`}
                                >
                                    {currentQuestion === sampleQuestions.length - 1 ? (
                                        isSubmitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4 mr-2" />
                                                Submit
                                            </>
                                        )
                                    ) : (
                                        <>
                                            Next
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                </AnimatePresence>
                
                <div className="text-center mt-6 text-gray-500 text-sm">
                    Question {currentQuestion + 1} of {sampleQuestions.length}
                </div>
            </div>
        </div>
    );
} 