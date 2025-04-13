'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getQuizHistory, CompleteQuizResult } from '@/lib/quizUtils';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    BarChart4, 
    Calendar, 
    ChevronLeft, 
    ChevronRight, 
    Clock, 
    HeartPulse,
    Brain,
    Scale,
    Flame,
    DropletIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function HealthHistoryPage() {
    const [history, setHistory] = useState<CompleteQuizResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuiz, setSelectedQuiz] = useState<CompleteQuizResult | null>(null);
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const loadHistory = async () => {
            if (!user) return;
            
            setLoading(true);
            try {
                const quizHistory = await getQuizHistory(user.uid);
                setHistory(quizHistory);
                if (quizHistory.length > 0) {
                    setSelectedQuiz(quizHistory[0]); // Select most recent by default
                }
            } catch (error) {
                console.error("Error loading quiz history:", error);
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, [user]);

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', { 
            year: 'numeric', 
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const getRiskLevelColor = (level: string | undefined) => {
        if (!level) return 'bg-gray-100 text-gray-700 border-gray-200';
        
        switch (level.toLowerCase()) {
            case 'low': return 'bg-green-100 text-green-700 border-green-200';
            case 'moderate': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'high': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getRiskLevelTextColor = (level: string | undefined) => {
        if (!level) return 'text-gray-600';
        
        switch (level.toLowerCase()) {
            case 'low': return 'text-green-600';
            case 'moderate': return 'text-yellow-600';
            case 'high': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-10 px-4">
            <div className="max-w-6xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 flex items-center justify-between"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Health Assessment History</h1>
                        <p className="text-gray-600 mt-1">Track your health progress over time</p>
                    </div>
                    <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => router.push('/dashboard')}
                    >
                        <ChevronLeft className="h-4 w-4" /> Back to Dashboard
                    </Button>
                </motion.div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-pulse flex flex-col items-center">
                            <HeartPulse className="h-12 w-12 text-red-400 mb-4" />
                            <p className="text-xl text-gray-500">Loading your health history...</p>
                        </div>
                    </div>
                ) : history.length === 0 ? (
                    <Card className="w-full shadow-md">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <BarChart4 className="h-16 w-16 text-gray-300 mb-4" />
                            <h3 className="text-xl font-medium text-gray-700 mb-2">No Assessment History</h3>
                            <p className="text-gray-500 mb-6 text-center max-w-md">
                                You haven't completed any health assessments yet. Take your first assessment to start tracking your health.
                            </p>
                            <Button 
                                className="gap-2"
                                onClick={() => router.push('/quiz')}
                            >
                                Take Health Assessment <ChevronRight className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Left sidebar - Assessment history list */}
                        <div className="md:col-span-1">
                            <Card className="shadow-md">
                                <CardHeader className="pb-3">
                                    <CardTitle>Your Assessments</CardTitle>
                                    <CardDescription>
                                        Select an assessment to view details
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <ul className="divide-y">
                                        {history.map((quiz, index) => (
                                            <li 
                                                key={index}
                                                className={`px-4 py-3 cursor-pointer transition-colors ${selectedQuiz === quiz ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                                onClick={() => setSelectedQuiz(quiz)}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRiskLevelColor(quiz.riskLevel)}`}>
                                                                {quiz.riskLevel}
                                                            </span>
                                                            {quiz.aiAnalyzed && (
                                                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                                                                    AI
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>{formatDate(quiz.completedAt)}</span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className={`h-4 w-4 ${selectedQuiz === quiz ? 'text-blue-500' : 'text-gray-300'}`} />
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                            <Button 
                                className="mt-4 w-full gap-2"
                                onClick={() => router.push('/quiz')}
                            >
                                Take New Assessment <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Right content - Selected assessment details */}
                        {selectedQuiz && (
                            <motion.div 
                                className="md:col-span-2"
                                key={selectedQuiz.completedAt.toString()}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card className="shadow-md">
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    Assessment Details
                                                    <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${getRiskLevelColor(selectedQuiz.riskLevel)}`}>
                                                        {selectedQuiz.riskLevel || 'Unknown'} Risk
                                                    </span>
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {formatDate(selectedQuiz.completedAt)}
                                                    {selectedQuiz.aiAnalyzed && (
                                                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            <Brain className="h-3 w-3" /> AI Analyzed
                                                        </span>
                                                    )}
                                                </CardDescription>
                                            </div>
                                            <div className="text-center">
                                                <span className={`text-3xl font-bold ${getRiskLevelTextColor(selectedQuiz.riskLevel)}`}>
                                                    {selectedQuiz.riskScore || 0}
                                                </span>
                                                <p className="text-xs text-gray-500">Risk Score</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Health Metrics */}
                                        <div>
                                            <h3 className="text-lg font-medium mb-3">Health Metrics</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-white p-4 rounded-lg border shadow-sm">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="text-sm font-medium text-gray-500">BMI</div>
                                                        <Scale className="h-4 w-4 text-blue-500" />
                                                    </div>
                                                    <div className="text-2xl font-bold">{selectedQuiz.healthMetrics?.bmi || '-'}</div>
                                                    <div className="text-xs text-gray-500">{selectedQuiz.healthMetrics?.bmiCategory || 'Unknown'}</div>
                                                </div>
                                                
                                                <div className="bg-white p-4 rounded-lg border shadow-sm">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="text-sm font-medium text-gray-500">Calories</div>
                                                        <Flame className="h-4 w-4 text-orange-500" />
                                                    </div>
                                                    <div className="text-2xl font-bold">{selectedQuiz.healthMetrics?.bmr || '-'}</div>
                                                    <div className="text-xs text-gray-500">Daily needs</div>
                                                </div>
                                                
                                                <div className="bg-white p-4 rounded-lg border shadow-sm">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="text-sm font-medium text-gray-500">Water</div>
                                                        <DropletIcon className="h-4 w-4 text-blue-500" />
                                                    </div>
                                                    <div className="text-2xl font-bold">{selectedQuiz.healthMetrics?.waterNeeded || '-'}L</div>
                                                    <div className="text-xs text-gray-500">Daily target</div>
                                                </div>
                                                
                                                <div className="bg-white p-4 rounded-lg border shadow-sm">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="text-sm font-medium text-gray-500">Weight Range</div>
                                                        <Scale className="h-4 w-4 text-green-500" />
                                                    </div>
                                                    <div className="text-2xl font-bold">{selectedQuiz.healthMetrics?.idealWeightRange?.min || '-'}-{selectedQuiz.healthMetrics?.idealWeightRange?.max || '-'}</div>
                                                    <div className="text-xs text-gray-500">Ideal (kg)</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* AI Recommendations if available */}
                                        {selectedQuiz.aiAnalysis && (
                                            <div>
                                                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                                                    AI Recommendations
                                                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                                                        Phi-4
                                                    </span>
                                                </h3>
                                                <div className="grid sm:grid-cols-2 gap-3">
                                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                        <h4 className="text-sm font-medium text-blue-700 mb-1">Exercise</h4>
                                                        <p className="text-sm text-gray-700">
                                                            {selectedQuiz.aiAnalysis.recommendations.exercise}
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                                        <h4 className="text-sm font-medium text-green-700 mb-1">Nutrition</h4>
                                                        <p className="text-sm text-gray-700">
                                                            {selectedQuiz.aiAnalysis.recommendations.nutrition}
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                                        <h4 className="text-sm font-medium text-indigo-700 mb-1">Sleep</h4>
                                                        <p className="text-sm text-gray-700">
                                                            {selectedQuiz.aiAnalysis.recommendations.sleep}
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                                                        <h4 className="text-sm font-medium text-purple-700 mb-1">Mental Health</h4>
                                                        <p className="text-sm text-gray-700">
                                                            {selectedQuiz.aiAnalysis.recommendations.mentalHealth}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {/* Health Insights */}
                                                <div className="mt-4 grid sm:grid-cols-3 gap-3">
                                                    <div className="p-3 bg-white rounded-lg border">
                                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Strengths</h4>
                                                        <ul className="text-xs text-gray-600 space-y-1">
                                                            {selectedQuiz.aiAnalysis.healthInsights.strengths.map((item, i) => (
                                                                <li key={i} className="flex items-start gap-1">
                                                                    <span className="text-green-500 mt-0.5">•</span>
                                                                    <span>{item}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    
                                                    <div className="p-3 bg-white rounded-lg border">
                                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Areas to Improve</h4>
                                                        <ul className="text-xs text-gray-600 space-y-1">
                                                            {selectedQuiz.aiAnalysis.healthInsights.areasForImprovement.map((item, i) => (
                                                                <li key={i} className="flex items-start gap-1">
                                                                    <span className="text-amber-500 mt-0.5">•</span>
                                                                    <span>{item}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    
                                                    <div className="p-3 bg-white rounded-lg border">
                                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Health Considerations</h4>
                                                        <ul className="text-xs text-gray-600 space-y-1">
                                                            {selectedQuiz.aiAnalysis.healthInsights.longTermRisks.map((item, i) => (
                                                                <li key={i} className="flex items-start gap-1">
                                                                    <span className="text-red-500 mt-0.5">•</span>
                                                                    <span>{item}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Answers summary */}
                                        <div>
                                            <h3 className="text-lg font-medium mb-3">Assessment Responses</h3>
                                            <div className="bg-gray-50 p-4 rounded-lg border text-sm">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                    {Object.entries(selectedQuiz.answers)
                                                        .filter(([key]) => !isNaN(Number(key)))
                                                        .sort((a, b) => Number(a[0]) - Number(b[0]))
                                                        .map(([key, value]) => (
                                                            <div key={key} className="p-2 bg-white rounded border">
                                                                <div className="text-xs text-gray-500">Question {key}</div>
                                                                <div className="font-medium">{value}</div>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
} 