'use client'; // Needed for potential future hooks (useEffect, useState)

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { 
    ClipboardList, 
    Activity, 
    Lightbulb, 
    TrendingUp, 
    Heart, 
    Droplet,
    Flame,
    Apple,
    Trophy,
    Calendar,
    ArrowRight, 
    CheckCircle2,
    AlertCircle,
    Clock,
    BookOpen,
    Calendar as CalendarIcon,
    CheckSquare,
    Square,
    PlusCircle,
    ChevronRight,
    Bot
} from 'lucide-react';
import { motion } from "framer-motion";
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, updateDoc, increment } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/config';
import { Timestamp } from 'firebase/firestore';
import QuizHistoryCard from '@/components/QuizHistoryCard';
import Logo from '@/components/Logo';

// Default suggestions for new users without any health data
const defaultSuggestions = [
    "Complete your health assessment to get personalized recommendations.",
    "Set up your daily health tasks to build healthy habits.",
    "Track your water intake and activity levels daily."
];

// Default risk level
const defaultRiskLevel = "Unknown";

// Animation variants
const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
        opacity: 1, 
        y: 0, 
        transition: { duration: 0.4 } 
    }
};

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

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [userName, setUserName] = useState("User");
    const [riskLevel, setRiskLevel] = useState("");
    const [score, setScore] = useState(0);
    const [suggestions, setSuggestions] = useState(defaultSuggestions);
    const [lastQuizDate, setLastQuizDate] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasData, setHasData] = useState(false);
    
    // Add health metrics state with empty defaults
    const [healthMetrics, setHealthMetrics] = useState({
        bmi: 0,
        bmiCategory: "",
        dailyCalories: 0,
        waterNeeded: 0,
        streakDays: 0,
        completedGoals: 0
    });

    // Add health tracking data with empty defaults
    const [healthTracking, setHealthTracking] = useState({
        weeklyActivity: [0, 0, 0, 0, 0, 0, 0], // Percentages for each day
        waterIntake: 0, // Percentage of daily goal
        sleepQuality: 0, // Percentage score
        nutrition: 0 // Percentage score
    });

    // Add glass counter for water intake
    const [glassesCount, setGlassesCount] = useState(0);

    // Real appointments state
    const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
    const [appointmentsLoading, setAppointmentsLoading] = useState(true);

    // Health articles state
    const [healthArticles, setHealthArticles] = useState<any[]>([]);
    const [articlesLoading, setArticlesLoading] = useState(true);

    // Daily tasks state
    const [dailyTasks, setDailyTasks] = useState<any[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [todayProgress, setTodayProgress] = useState(0);

    useEffect(() => {
        async function fetchUserData() {
            if (!user) return;
            
            try {
                setLoading(true);
                setError(null);
                
                // Reference to the user's document
                const userDocRef = doc(firestore, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    let dataFound = false;
                    
                    // Set user's display name if available
                    if (user.displayName) {
                        setUserName(user.displayName);
                    } else if (userData.displayName) {
                        setUserName(userData.displayName);
                    } else if (userData.name) {
                        setUserName(userData.name);
                    } else if (userData.email) {
                        const emailName = userData.email.split('@')[0];
                        setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
                    }
                    
                    // Get the latest quiz data if available
                    if (userData.latestQuiz) {
                        dataFound = true;
                        const quizData = userData.latestQuiz;
                        console.log("Found quiz data:", quizData);
                        
                        // Format the date when quiz was completed
                        if (quizData.completedAt) {
                            const quizDate = quizData.completedAt instanceof Timestamp 
                                ? quizData.completedAt.toDate() 
                                : new Date(quizData.completedAt);
                                
                            setLastQuizDate(new Intl.DateTimeFormat('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            }).format(quizDate));
                        }
                        
                        // Set risk level and score
                        const userRiskLevel = quizData.riskLevel || "";
                        setRiskLevel(userRiskLevel);
                        setScore(quizData.riskScore || 0);
                        
                        // Helper function to safely parse float values with defaults
                        const safeParseFloat = (value: any, defaultVal: number) => {
                            if (value === undefined || value === null) return defaultVal;
                            const parsed = parseFloat(value);
                            return isNaN(parsed) ? defaultVal : parsed;
                        };
                        
                        // Set health metrics from quiz data with proper defaults
                        setHealthMetrics({
                            bmi: safeParseFloat(quizData.bmi, 0),
                            bmiCategory: quizData.bmiCategory || "",
                            dailyCalories: safeParseFloat(quizData.bmr, 0),
                            waterNeeded: safeParseFloat(quizData.waterNeeded, 0),
                            streakDays: userData.streakDays || 0,
                            completedGoals: userData.completedGoals || 0
                        });
                    }
                    
                    // Get daily tasks if available
                    if (userData.dailyTasks && userData.dailyTasks.items) {
                        dataFound = true;
                        const tasks = userData.dailyTasks.items;
                        setDailyTasks(tasks);
                        
                        // Calculate progress
                        const completed = tasks.filter((task: any) => task.completed).length;
                        const total = tasks.length;
                        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                        setTodayProgress(progress);
                        } else {
                        // Create default empty tasks array
                        setDailyTasks([]);
                        setTodayProgress(0);
                    }
                    
                    // Get health tracking data if available
                    if (userData.healthTracking) {
                        dataFound = true;
                        setHealthTracking({
                            weeklyActivity: userData.healthTracking.weeklyActivity || [0, 0, 0, 0, 0, 0, 0],
                            waterIntake: userData.healthTracking.waterIntake || 0,
                            sleepQuality: userData.healthTracking.sleepQuality || 0,
                            nutrition: userData.healthTracking.nutrition || 0
                        });
                    }
                    
                    setHasData(dataFound);
                        } else {
                    // No user document exists yet
                    setHasData(false);
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
                setError("Failed to load your health information. Please try again later.");
            } finally {
                setLoading(false);
            }
        }
        
        fetchUserData();
        
        // Fetch appointments when user is available
        if (user) {
            fetchAppointments();
            fetchHealthArticles();
        }
    }, [user]);
    
    // Function to fetch user's appointments
    async function fetchAppointments() {
        if (!user) return;
        
        try {
            setAppointmentsLoading(true);
            console.log("Dashboard - Current user ID:", user.uid); // Debug log
            
            // Query appointments collection for this user
            const appointmentsRef = collection(firestore, 'appointments');
            const userAppointmentsQuery = query(
                appointmentsRef,
                where('userId', '==', user.uid),
                where('date', '>=', new Date().toISOString().split('T')[0]),
                orderBy('date'),
                orderBy('time'),
                limit(5)
            );
            
            const querySnapshot = await getDocs(userAppointmentsQuery);
            const appointments: any[] = [];
            
            querySnapshot.forEach((doc) => {
                appointments.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log("Dashboard - Found appointments:", appointments.length); // Debug log
            
            // No demo appointments - only show real appointments
            setUpcomingAppointments(appointments);
        } catch (error) {
            console.error("Error fetching appointments:", error);
            setUpcomingAppointments([]); // Empty array instead of demo appointments
        } finally {
            setAppointmentsLoading(false);
        }
    }
    
    // Function to fetch health articles
    async function fetchHealthArticles() {
        try {
            setArticlesLoading(true);
            
            // Query articles collection
            const articlesRef = collection(firestore, 'articles');
            const articlesQuery = query(
                articlesRef,
                limit(3)
            );
            
            const querySnapshot = await getDocs(articlesQuery);
            const articles: any[] = [];
            
            querySnapshot.forEach((doc) => {
                articles.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            if (articles.length > 0) {
                setHealthArticles(articles);
            }
        } catch (error) {
            console.error("Error fetching health articles:", error);
        } finally {
            setArticlesLoading(false);
        }
    }
    
    // Function to toggle task completion
    async function toggleTaskCompletion(taskId: string) {
        if (!user) return;
        
        // Get the task being toggled
        const task = dailyTasks.find(t => t.id === taskId);
        const isWaterTask = task?.title.toLowerCase().includes('water') || task?.title.toLowerCase().includes('glass');
        const isCompleting = task ? !task.completed : false;
        
        // Update local state
        const updatedTasks = dailyTasks.map(task => 
            task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        setDailyTasks(updatedTasks);
        
        // Calculate new progress
        const completed = updatedTasks.filter(task => task.completed).length;
        const total = updatedTasks.length;
        const newProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
        setTodayProgress(newProgress);
        
        // Update water intake if this is a water-related task
        let newWaterIntake = healthTracking.waterIntake;
        if (isWaterTask) {
            // Toggle water intake between 0 and 100% based on completion
            newWaterIntake = isCompleting ? 100 : 0;
            setHealthTracking(prev => ({
                ...prev,
                waterIntake: newWaterIntake
            }));
            
            // Update glasses count
            setGlassesCount(isCompleting ? 8 : 0);
        }
        
        // Update in Firestore
        try {
            const userDocRef = doc(firestore, 'users', user.uid);
            
            // Update daily tasks
            await updateDoc(userDocRef, {
                'dailyTasks.items': updatedTasks,
                'dailyTasks.lastUpdated': Timestamp.now()
            });
            
            // Update activity metrics and water intake if needed
                if (isCompleting) {
                const updateData: any = {
                        'healthTracking.todayActivity': newProgress,
                        'streakDays': increment(task.completed ? 0 : 1),
                        'completedGoals': increment(1)
                };
                
                if (isWaterTask) {
                    updateData['healthTracking.waterIntake'] = newWaterIntake;
                }
                
                await updateDoc(userDocRef, updateData);
                    
                    // Also update local state
                    setHealthMetrics(prev => ({
                        ...prev,
                        streakDays: prev.streakDays + (task.completed ? 0 : 1),
                        completedGoals: prev.completedGoals + 1
                    }));
                    
                    // Update today's activity in weekly activity
                    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, ...
                    const dayIndex = today === 0 ? 6 : today - 1; // Convert to 0 = Monday, ... 6 = Sunday
                    
                    const updatedWeeklyActivity = [...healthTracking.weeklyActivity];
                    updatedWeeklyActivity[dayIndex] = newProgress;
                    
                    setHealthTracking(prev => ({
                        ...prev,
                        weeklyActivity: updatedWeeklyActivity
                    }));
                    
                    // Update in Firestore
                    await updateDoc(userDocRef, {
                        'healthTracking.weeklyActivity': updatedWeeklyActivity
                    });
            }
        } catch (error) {
            console.error('Error updating task:', error);
        }
    }
    
    // Function to track water intake directly
    async function updateWaterIntake(increment: boolean) {
        if (!user) return;
        
        // Calculate new glasses count
        const maxGlasses = 8;
        const newGlassesCount = increment 
            ? Math.min(glassesCount + 1, maxGlasses) 
            : Math.max(glassesCount - 1, 0);
        
        // Calculate percentage
        const newPercentage = Math.round((newGlassesCount / maxGlasses) * 100);
        
        // Update local state
        setGlassesCount(newGlassesCount);
        setHealthTracking(prev => ({
            ...prev,
            waterIntake: newPercentage
        }));
        
        // Find water-related task if any
        const waterTask = dailyTasks.find(task => 
            task.title.toLowerCase().includes('water') || 
            task.title.toLowerCase().includes('glass')
        );
        
        // If water task exists and completion state needs to change
        if (waterTask) {
            const shouldBeCompleted = newGlassesCount >= maxGlasses;
            if (waterTask.completed !== shouldBeCompleted) {
                // Toggle task completion which will also update water intake
                toggleTaskCompletion(waterTask.id);
                return; // Return early as toggleTaskCompletion will handle the updates
            }
        }
        
        // Otherwise just update water intake in Firestore
        try {
            const userDocRef = doc(firestore, 'users', user.uid);
            await updateDoc(userDocRef, {
                'healthTracking.waterIntake': newPercentage
            });
        } catch (error) {
            console.error('Error updating water intake:', error);
        }
    }
    
    // Function to add a new task
    async function addNewTask() {
        if (!newTaskTitle.trim() || !user) return;
        
        const newTask = {
            id: `task${Date.now()}`, // Generate unique ID
            title: newTaskTitle.trim(),
            completed: false
        };
        
        // Update local state
        const updatedTasks = [...dailyTasks, newTask];
        setDailyTasks(updatedTasks);
        setNewTaskTitle(''); // Reset input
        
        // Update in Firestore
        try {
            const userDocRef = doc(firestore, 'users', user.uid);
            await updateDoc(userDocRef, {
                'dailyTasks.items': updatedTasks,
                'dailyTasks.lastUpdated': Timestamp.now()
            });
        } catch (error) {
            console.error('Error adding new task:', error);
        }
    }
    
    // Loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
                <div className="animate-pulse flex flex-col items-center">
                    <Logo size={80} className="mb-4" />
                    <p className="text-xl font-medium text-gray-700">Loading your dashboard...</p>
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
                            <Logo size={64} />
                            </div>
                        <CardTitle className="text-2xl text-center">Welcome to Vitraya</CardTitle>
                        <CardDescription className="text-center text-base">
                            Login to access your personal health dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                            <Link href="/login">Go to Login</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString(undefined, dateOptions as any);

    // Update the risk level helper functions
    const getRiskLevelColor = () => {
        if (!riskLevel) return 'bg-gray-100 text-gray-500';
        
        switch(riskLevel.toLowerCase()) {
            case 'high': return 'bg-red-100 text-red-500';
            case 'moderate': return 'bg-yellow-100 text-yellow-500';
            case 'low': return 'bg-green-100 text-green-500';
            default: return 'bg-gray-100 text-gray-500';
        }
    };
    
    const getRiskLevelIcon = () => {
        if (!riskLevel) return <AlertCircle className="h-6 w-6" />;
        
        switch(riskLevel.toLowerCase()) {
            case 'high':
                return <AlertCircle className="h-6 w-6" />;
            case 'moderate':
                return <Activity className="h-6 w-6" />;
            case 'low':
                return <CheckCircle2 className="h-6 w-6" />;
            default:
                return <AlertCircle className="h-6 w-6" />;
        }
    };
    
    const getRiskAdvice = () => {
        if (!riskLevel) return "Complete your health assessment to get personalized recommendations.";
        
        switch(riskLevel.toLowerCase()) {
            case 'high':
                return "Consider scheduling a check-up with your healthcare provider. Focus on improving your diet, increasing physical activity, and managing stress levels.";
            case 'moderate':
                return "You're doing well in some areas, but could benefit from more regular exercise, better nutrition, or improved sleep habits. Consider setting small, achievable health goals.";
            case 'low':
                return "Great job maintaining your health! Continue your healthy habits and consider helping others improve their health journey too.";
            default:
                return "Complete your health assessment to get personalized recommendations.";
        }
    };

    // Get BMI category color
    const getBmiCategoryColor = () => {
        switch(healthMetrics.bmiCategory) {
            case 'Underweight': return 'text-blue-500';
            case 'Healthy Weight': return 'text-green-500';
            case 'Overweight': return 'text-yellow-500';
            case 'Obese': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    // Show empty state for no data
    if (user && !loading && !hasData) {
    return (
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <h1 className="text-3xl font-bold mb-4">Welcome, {userName}!</h1>
                
        <motion.div 
                    className="bg-blue-50 border border-blue-200 rounded-xl p-8 mb-8 text-center shadow-md"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Activity className="h-12 w-12 text-blue-500" />
                </div>
                    <h2 className="text-2xl font-semibold mb-2">Get Started with Your Health Journey</h2>
                    <p className="text-gray-600 mb-6">Complete your health assessment to see personalized insights and recommendations.</p>
                    <Button 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                        size="lg"
                        asChild
                    >
                        <Link href="/quiz">Take Health Assessment</Link>
                    </Button>
                </motion.div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="shadow-md h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckSquare className="h-5 w-5 text-green-500" />
                                    Daily Health Tasks
                                </CardTitle>
                                <CardDescription>Set up daily tasks to build healthy habits</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-6 bg-gray-50 rounded-lg border border-gray-100 text-center">
                                    <p className="text-gray-600 mb-4">Add your first health task to get started</p>
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="Enter a new health task..." 
                                            value={newTaskTitle}
                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') addNewTask();
                                            }}
                                            className="flex-1"
                                        />
                                        <Button onClick={addNewTask} disabled={!newTaskTitle.trim()}>
                                            Add
                    </Button>
                </div>
                                </div>
                            </CardContent>
                        </Card>
            </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <QuizHistoryCard />
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white">
            <div className="min-h-screen pb-12">
                <div className="container mx-auto px-4 py-8 max-w-6xl">
                    {/* Welcome Header */}
                    <div className="mb-8 bg-white rounded-3xl p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-blue-600">
                                    Welcome, {userName}!
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    {new Date().toLocaleDateString('en-US', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})} • Here's your health overview
                                </p>
                            </div>
                            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                                <Button asChild size="sm" variant="outline" className="text-xs sm:text-sm rounded-full whitespace-nowrap">
                                    <Link href="/agent" className="flex items-center gap-1">
                                        <Bot className="h-4 w-4" />
                                        Talk to Vitraya Coach AI
                                    </Link>
                                </Button>
                                <Button asChild size="sm" className="text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 rounded-full whitespace-nowrap">
                                    <Link href="/quiz" className="flex items-center gap-1">
                                        <ClipboardList className="h-4 w-4" />
                                        Take Health Assessment
                                    </Link>
                                </Button>
                                </div>
                                </div>
                            </div>

                    {/* Health Metrics Grid - First row */}
                    <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {/* BMI Card */}
                        <div className="bg-white rounded-3xl shadow-md">
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-medium text-gray-600 flex items-center gap-2">
                                        <Heart className="h-5 w-5 text-rose-500" />
                                        BMI
                                    </h3>
                                    {healthMetrics.bmiCategory && (
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            healthMetrics.bmiCategory === 'Healthy Weight' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {healthMetrics.bmiCategory}
                                        </span>
                                    )}
                        </div>
                                {healthMetrics.bmi > 0 ? (
                                    <div>
                                        <div className="text-3xl font-bold text-gray-800">{healthMetrics.bmi.toFixed(1)}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Body Mass Index
                    </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-start py-2">
                                        <p className="text-sm text-gray-500">Take the health quiz to calculate your BMI</p>
                                        <Link href="/quiz" className="text-blue-500 text-sm mt-1 inline-flex items-center hover:underline">
                                            Get started <ChevronRight className="h-4 w-4 ml-1" />
                                        </Link>
                        </div>
                    )}
                            </div>
                        </div>

                        {/* Health Risk Card */}
                        <div className="bg-white rounded-3xl shadow-md">
                            <div className="p-5">
                                <h3 className="font-medium text-gray-600 mb-3 flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-blue-500" />
                                    Health Risk Level
                                </h3>
                                {riskLevel ? (
                                    <>
                                        <div className="flex justify-between items-center mb-2">
                                            <div className={`py-1 px-3 text-sm font-medium rounded-full ${getRiskLevelColor()}`}>
                                                <span>{riskLevel}</span>
                                </div>
                                            <div className="font-bold text-xl text-gray-900">
                                                <span>{score}/100</span>
                            </div>
                            </div>
                                        {lastQuizDate && (
                                            <div className="text-xs text-gray-500">
                                                Assessed on {lastQuizDate}
                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-start py-2">
                                        <p className="text-sm text-gray-500">Get your personalized risk analysis</p>
                                        <Link href="/quiz" className="text-blue-500 text-sm mt-1 inline-flex items-center hover:underline">
                                            Take assessment <ChevronRight className="h-4 w-4 ml-1" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Daily Calories Card */}
                        <div className="bg-white rounded-3xl shadow-md">
                            <div className="p-5">
                                <h3 className="font-medium text-gray-600 mb-3 flex items-center gap-2">
                                    <Flame className="h-5 w-5 text-orange-500" />
                                Daily Calories
                                </h3>
                                {healthMetrics.dailyCalories > 0 ? (
                                    <div>
                                        <div className="text-3xl font-bold text-gray-800">{healthMetrics.dailyCalories.toLocaleString()}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Recommended daily intake
                                    </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-start py-2">
                                        <p className="text-sm text-gray-500">See your recommended daily calories</p>
                                        <Link href="/quiz" className="text-blue-500 text-sm mt-1 inline-flex items-center hover:underline">
                                            Calculate now <ChevronRight className="h-4 w-4 ml-1" />
                                        </Link>
                                    </div>
                                )}
                                </div>
                            </div>
                        
                        {/* Water Intake Card */}
                        <div className="bg-white rounded-3xl shadow-md">
                            <div className="p-5">
                                <h3 className="font-medium text-gray-600 mb-3 flex items-center gap-2">
                                    <Droplet className="h-5 w-5 text-blue-500" />
                                Water Intake
                                </h3>
                                {healthMetrics.waterNeeded > 0 ? (
                                    <>
                                        <div className="mb-3">
                                            <div className="text-3xl font-bold text-gray-800">{healthMetrics.waterNeeded}L</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Recommended daily intake
                                    </div>
                                </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span>Today's progress</span>
                                                <span>{healthTracking.waterIntake}%</span>
                            </div>
                                            <div className="h-2 w-full bg-blue-100 rounded-full">
                                                <div 
                                                    className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                                                    style={{ width: `${healthTracking.waterIntake}%` }}
                                                ></div>
                                </div>
                                            <div className="flex justify-between items-center mt-3">
                                                <div className="text-xs text-gray-500">
                                                    {glassesCount} of 8 glasses
                            </div>
                                                <div className="flex gap-1">
                                                    <Button 
                                                        size="icon" 
                                                        variant="outline" 
                                                        onClick={() => updateWaterIntake(false)}
                                                        disabled={glassesCount <= 0}
                                                        className="h-7 w-7 rounded-full"
                                                    >
                                                        <span className="font-bold">-</span>
                                                    </Button>
                                                    <Button 
                                                        size="icon" 
                                                        onClick={() => updateWaterIntake(true)}
                                                        disabled={glassesCount >= 8}
                                                        className="h-7 w-7 bg-blue-500 hover:bg-blue-600 rounded-full"
                                                    >
                                                        <span className="font-bold">+</span>
                                                    </Button>
                                    </div>
                                    </div>
                                </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-start py-2">
                                        <p className="text-sm text-gray-500">Get your daily hydration goal</p>
                                        <Link href="/quiz" className="text-blue-500 text-sm mt-1 inline-flex items-center hover:underline">
                                            Find out <ChevronRight className="h-4 w-4 ml-1" />
                                        </Link>
                                        </div>
                                )}
                                    </div>
                                </div>
            </div>

                    {/* Activity and Progress Tracking - Second row */}
                    <div className="grid gap-5 lg:grid-cols-2">
                        {/* Daily Tasks */}
                        <div className="bg-white rounded-3xl shadow-md p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-medium text-gray-600 flex items-center gap-2">
                                    <CheckSquare className="h-5 w-5 text-emerald-500" /> 
                                    Daily Tasks
                                </h3>
                                <div className="text-sm font-normal text-emerald-600">
                                    {todayProgress}% Complete
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                                Complete these daily tasks to improve your health
                            </p>
                            
                            <div className="h-2 w-full bg-emerald-100 rounded-full mb-5">
                                <div 
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${todayProgress}%` }}
                                ></div>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                                {dailyTasks.map((task) => (
                                    <div 
                                        key={task.id} 
                                        className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                                            task.completed 
                                                ? 'bg-emerald-50 text-emerald-700' 
                                                : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
                                        onClick={() => toggleTaskCompletion(task.id)}
                                    >
                                        <div className={`${task.completed ? 'text-emerald-500' : 'text-blue-500'}`}>
                                            {task.completed ? (
                                                <CheckSquare className="h-5 w-5" />
                                            ) : (
                                                <Square className="h-5 w-5" />
                                            )}
                                        </div>
                                        <span className={`flex-1 ${task.completed ? 'line-through opacity-70' : ''}`}>
                                            {task.title}
                                        </span>
                                    </div>
                                ))}
                                
                                {dailyTasks.length === 0 && (
                                    <div className="text-center py-4 text-gray-500 italic text-sm">
                                        No tasks yet. Add some below!
                                    </div>
                                )}
                            </div>
                            
                            {/* Add new task input */}
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="Add a new health task..." 
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addNewTask()}
                                    className="flex-1 border-gray-200 focus:ring-blue-500 rounded-full"
                                />
                                <Button 
                                    onClick={addNewTask}
                                    disabled={!newTaskTitle.trim()}
                                    size="icon"
                                    className="rounded-full bg-blue-500 hover:bg-blue-600 h-10 w-10"
                                >
                                    <PlusCircle className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Right column with Weekly Activity and Suggestions */}
                        <div className="flex flex-col gap-5">
                            {/* Weekly Activity - Smaller size */}
                            <div className="bg-white rounded-3xl shadow-md p-5">
                                <h3 className="font-medium text-gray-600 flex items-center gap-2 mb-4">
                                    <Activity className="h-5 w-5 text-blue-500" />
                                    Weekly Activity
                                </h3>
                                
                                {healthTracking.weeklyActivity.some(val => val > 0) ? (
                                    <div>
                                        <div className="flex items-end justify-between h-28 mb-3">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                                                const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, ...
                                                const dayIndex = (i + 1) % 7; // Convert to 0 = Sunday, ... 6 = Saturday
                                                const isToday = (dayIndex === 0 ? 7 : dayIndex) === (today === 0 ? 7 : today);
                                                const activityValue = healthTracking.weeklyActivity[i];
                                                
                                                // Determine color based on activity level
                                                let barColor = isToday ? 'bg-blue-500' : 'bg-blue-200';
                                                if (activityValue > 80) {
                                                    barColor = isToday ? 'bg-green-500' : 'bg-green-200';
                                                } else if (activityValue > 50) {
                                                    barColor = isToday ? 'bg-blue-500' : 'bg-blue-200';
                                                } else if (activityValue > 30) {
                                                    barColor = isToday ? 'bg-yellow-500' : 'bg-yellow-200';
                                                } else if (activityValue > 0) {
                                                    barColor = isToday ? 'bg-orange-500' : 'bg-orange-200';
                                                }
                                                
                                    return (
                                                    <div key={day} className="flex flex-col items-center">
                                                        <div className="text-xs font-semibold text-gray-700 mb-1">
                                                            {activityValue}%
                                                        </div>
                                                        <div 
                                                            className={`w-6 md:w-8 rounded-lg ${barColor} transition-all duration-500 ease-in-out hover:opacity-80`} 
                                                            style={{ 
                                                                height: `${Math.max(activityValue, 5)}%`,
                                                                minHeight: '4px'
                                                            }}
                                            ></div>
                                                        <div className={`text-xs mt-2 font-medium ${isToday ? 'text-blue-600 bg-blue-50 px-2 py-1 rounded-full' : 'text-gray-500'}`}>
                                                            {day}
                                                        </div>
                                        </div>
                                    );
                                })}
                            </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="text-sm text-gray-700">
                                                Weekly Average: <span className="text-blue-600 font-semibold">{Math.round(healthTracking.weeklyActivity.reduce((a, b) => a + b, 0) / 7)}%</span>
                                </div>
                                            <div className="flex gap-2">
                                                <div className="flex items-center text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">
                                                    <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                                                    <span>High</span>
                                </div>
                                                <div className="flex items-center text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                                                    <span>Good</span>
                                </div>
                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 space-y-3 bg-gray-50 rounded-lg">
                                        <div className="text-center text-gray-500">
                                            <p className="mb-2">Complete daily tasks to track your activity</p>
                                            <p className="text-sm text-gray-400">Your weekly progress will appear here</p>
                                        </div>
                                        <Button variant="outline" size="sm" className="rounded-full" onClick={() => toggleTaskCompletion(dailyTasks[0]?.id)}>
                                            Complete a Task
                                        </Button>
                                    </div>
                                )}
            </div>

                            {/* Personalized Suggestions */}
                            <div className="bg-white rounded-3xl shadow-md p-5">
                                <h3 className="font-medium text-gray-600 flex items-center gap-2 mb-4">
                                    <Lightbulb className="h-5 w-5 text-amber-500" />
                                    Personalized Suggestions
                                </h3>
                                
                                <div className="space-y-3">
                                {suggestions.map((suggestion, index) => (
                                        <div 
                                        key={index}
                                            className="flex gap-3 p-3 rounded-lg bg-amber-50"
                                    >
                                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                                <Lightbulb className="h-4 w-4" />
                                        </div>
                                        <p className="text-sm text-gray-700">{suggestion}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Appointments Section */}
                    <div className="mt-5 bg-white rounded-3xl shadow-md p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-gray-600 flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-violet-500" />
                                Upcoming Appointments
                            </h3>
                            <Button asChild variant="ghost" size="sm" className="text-violet-600 hover:text-violet-700 hover:bg-violet-50">
                                <Link href="/appointments" className="text-xs font-medium flex items-center gap-1">
                                    View All <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
            </div>

                        {appointmentsLoading ? (
                            <div className="py-8 flex justify-center">
                                <div className="animate-pulse flex space-x-4">
                                    <div className="h-12 w-12 bg-violet-200 rounded-full"></div>
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="h-4 bg-violet-200 rounded w-3/4"></div>
                                        <div className="h-4 bg-violet-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        ) : upcomingAppointments.length > 0 ? (
                            <div className="space-y-4">
                                {upcomingAppointments.slice(0, 3).map((appointment) => (
                                    <div 
                                        key={appointment.id} 
                                        className="flex items-center justify-between p-4 rounded-xl bg-gray-50"
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 w-10 h-10 text-violet-500">
                                                <Calendar className="h-10 w-10" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">{appointment.type || appointment.title || "Medical Appointment"}</h4>
                                                <p className="text-sm text-gray-500">With Dr. {appointment.doctorName || appointment.doctor || "Unknown"}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-gray-900">{appointment.date}</p>
                                            <p className="text-sm text-gray-500">{appointment.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-gray-50 rounded-xl">
                                <div className="mx-auto w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mb-3">
                                    <Calendar className="h-6 w-6 text-violet-500" />
                            </div>
                                <h3 className="text-md font-medium text-gray-900 mb-1">No Upcoming Appointments</h3>
                                <p className="text-gray-500 text-sm mb-3">Schedule your next check-up</p>
                                <Button asChild size="sm" className="bg-violet-500 hover:bg-violet-600 text-white rounded-full">
                                    <Link href="/appointments">Schedule Appointment</Link>
                        </Button>
                            </div>
                        )}
                            </div>
                            </div>
                        </div>
                        </div>
    );
} 