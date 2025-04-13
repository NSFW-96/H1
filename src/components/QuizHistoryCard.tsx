import { useState, useEffect } from 'react';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { getQuizHistory, CompleteQuizResult } from '@/lib/quizUtils';
import { ChevronRight, BarChart4, Calendar, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const QuizHistoryCard = () => {
    const [history, setHistory] = useState<CompleteQuizResult[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const loadHistory = async () => {
            if (!user) return;
            
            setLoading(true);
            try {
                const quizHistory = await getQuizHistory(user.uid);
                setHistory(quizHistory);
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
        if (!level) return 'bg-gray-100 text-gray-700'; // Handle undefined case
        
        switch (level.toLowerCase()) {
            case 'low': return 'bg-green-100 text-green-700';
            case 'moderate': return 'bg-yellow-100 text-yellow-700';
            case 'high': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <Card className="w-full h-full shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    Health Assessment History
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => router.push('/quiz')}
                    >
                        Take Again <ChevronRight className="h-4 w-4" />
                    </Button>
                </CardTitle>
                <CardDescription>
                    Your previous health assessments and results
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-pulse flex flex-col items-center">
                            <BarChart4 className="h-8 w-8 text-blue-400 mb-2" />
                            <p className="text-gray-500">Loading history...</p>
                        </div>
                    </div>
                ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-center">
                        <Activity className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-gray-600">No assessment history yet</p>
                        <Button 
                            className="mt-4" 
                            size="sm"
                            onClick={() => router.push('/quiz')}
                        >
                            Take Your First Assessment
                        </Button>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {history.slice(0, 5).map((quiz, index) => (
                            <motion.li 
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRiskLevelColor(quiz.riskLevel)}`}>
                                                {quiz.riskLevel || 'Unknown'} Risk
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                Score: {quiz.riskScore || 0}/100
                                            </span>
                                            {quiz.aiAnalyzed && (
                                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                                                    AI Analysis
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                            <Calendar className="h-3 w-3" />
                                            <span>{formatDate(quiz.completedAt)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-center">
                                            <div className="text-sm font-medium">{quiz.healthMetrics?.bmi || '-'}</div>
                                            <div className="text-xs text-gray-500">BMI</div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                    </div>
                                </div>
                            </motion.li>
                        ))}
                        
                        {history.length > 5 && (
                            <Button 
                                variant="ghost" 
                                className="w-full text-sm text-blue-600 hover:text-blue-700 mt-2"
                                onClick={() => router.push('/health-history')}
                            >
                                View All History
                            </Button>
                        )}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
};

export default QuizHistoryCard; 