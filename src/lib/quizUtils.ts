import { firestore } from './firebase/config'; // Adjust path if needed
import { doc, setDoc, Timestamp, collection, addDoc, getDocs, query, orderBy, limit, getDoc } from 'firebase/firestore';

// Enhanced quiz result interface
export interface QuizAnswers {
    [key: string | number]: string | number;
    bmi?: string;
    bmiCategory?: string;
    idealWeightMin?: string;
    idealWeightMax?: string;
    bmr?: string;
    waterNeeded?: string;
    riskLevel?: string;
    riskScore?: number;
    aiAnalyzed?: boolean;
}

// AI analysis interface
export interface AIAnalysis {
    riskLevel: string;
    riskScore: number;
    recommendations: {
        exercise: string;
        nutrition: string;
        sleep: string;
        mentalHealth: string;
    };
    healthInsights: {
        strengths: string[];
        areasForImprovement: string[];
        longTermRisks: string[];
    };
}

// Complete quiz result with health metrics and AI analysis
export interface CompleteQuizResult {
    answers: QuizAnswers;
    healthMetrics: {
        bmi: number;
        bmiCategory: string;
        idealWeightRange: { min: number; max: number };
        bmr: number;
        waterNeeded: number;
    };
    riskLevel: string;
    riskScore: number;
    aiAnalysis?: AIAnalysis;
    aiAnalyzed: boolean;
    completedAt: Date;
}

// --- Firestore Saving Function ---
// Saves quiz results to a subcollection within the user's document
export const saveQuizResults = async (
    userId: string,
    answers: QuizAnswers
): Promise<{ riskLevel: string; riskScore: number; quizId: string } | null> => {
    if (!userId) {
        console.error("User ID is required to save results.");
        return null;
    }

    try {
        // Use provided risk levels if available, otherwise calculate them (fallback)
        const riskLevel = answers.riskLevel || 'Low';
        const riskScore = typeof answers.riskScore === 'number' 
            ? answers.riskScore 
            : (typeof answers.riskScore === 'string' ? parseInt(answers.riskScore, 10) : 0);
        
        const timestamp = Timestamp.now();
        
        // Extract health metrics from answers if available
        const healthMetrics = {
            bmi: answers.bmi ? parseFloat(answers.bmi.toString()) : 0,
            bmiCategory: answers.bmiCategory || 'Unknown',
            idealWeightRange: { 
                min: answers.idealWeightMin ? parseInt(answers.idealWeightMin.toString(), 10) : 0,
                max: answers.idealWeightMax ? parseInt(answers.idealWeightMax.toString(), 10) : 0,
            },
            bmr: answers.bmr ? parseInt(answers.bmr.toString(), 10) : 0,
            waterNeeded: answers.waterNeeded ? parseFloat(answers.waterNeeded.toString()) : 0
        };

        // Check if this includes AI analysis
        const aiAnalyzed = 'aiAnalyzed' in answers ? answers.aiAnalyzed === true : false;

        // Prepare the full quiz result document
        const quizResult = {
            answers,
            healthMetrics,
            riskLevel,
            riskScore,
            aiAnalyzed,
            completedAt: timestamp,
        };

        // Reference to the user's quiz history subcollection
        const quizHistoryRef = collection(firestore, 'users', userId, 'quizHistory');

        // Add a new document to the subcollection
        const quizDocRef = await addDoc(quizHistoryRef, quizResult);
        
        console.log("Quiz results saved successfully for user:", userId, "with ID:", quizDocRef.id);

        // Update the latest result directly on the user document for quick access
        const userDocRef = doc(firestore, 'users', userId);
        await setDoc(userDocRef, { 
            latestQuiz: {
                id: quizDocRef.id,
                riskLevel,
                riskScore,
                bmi: healthMetrics.bmi,
                bmiCategory: healthMetrics.bmiCategory,
                bmr: healthMetrics.bmr,
                waterNeeded: healthMetrics.waterNeeded,
                aiAnalyzed,
                completedAt: timestamp
            },
            healthMetrics // Also store latest health metrics at user level for quick access
        }, { merge: true }); // Merge to avoid overwriting other user data

        return { riskLevel, riskScore, quizId: quizDocRef.id };

    } catch (error) {
        console.error("Error saving quiz results:", error);
        return null;
    }
};

// Get the most recent quiz result for a user
export const getLatestQuizResult = async (userId: string): Promise<CompleteQuizResult | null> => {
    if (!userId) {
        console.error("User ID is required to get quiz results.");
        return null;
    }

    try {
        const quizHistoryRef = collection(firestore, 'users', userId, 'quizHistory');
        const q = query(quizHistoryRef, orderBy('completedAt', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return null;
        }

        const latestQuiz = querySnapshot.docs[0].data() as CompleteQuizResult;
        latestQuiz.completedAt = (latestQuiz.completedAt as unknown as Timestamp).toDate();
        
        return latestQuiz;
    } catch (error) {
        console.error("Error getting latest quiz result:", error);
        return null;
    }
};

// Get the user's quiz history
export const getQuizHistory = async (userId: string): Promise<CompleteQuizResult[]> => {
    if (!userId) {
        console.error("User ID is required to get quiz history.");
        return [];
    }

    try {
        const quizHistoryRef = collection(firestore, 'users', userId, 'quizHistory');
        const q = query(quizHistoryRef, orderBy('completedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const history = querySnapshot.docs.map(doc => {
            const data = doc.data() as CompleteQuizResult;
            data.completedAt = (data.completedAt as unknown as Timestamp).toDate();
            return data;
        });
        
        return history;
    } catch (error) {
        console.error("Error getting quiz history:", error);
        return [];
    }
};

// Update a quiz result with AI analysis
export const updateQuizWithAIAnalysis = async (
    userId: string, 
    quizId: string, 
    aiAnalysis: AIAnalysis
): Promise<boolean> => {
    if (!userId || !quizId) {
        console.error("User ID and Quiz ID are required to update with AI analysis.");
        return false;
    }

    try {
        const quizDocRef = doc(firestore, 'users', userId, 'quizHistory', quizId);
        const quizDoc = await getDoc(quizDocRef);
        
        if (!quizDoc.exists()) {
            console.error("Quiz document not found");
            return false;
        }
        
        await setDoc(quizDocRef, {
            aiAnalysis,
            aiAnalyzed: true,
            riskLevel: aiAnalysis.riskLevel,
            riskScore: aiAnalysis.riskScore
        }, { merge: true });
        
        // Also update the latest quiz in user document if this is the latest
        const userDocRef = doc(firestore, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.latestQuiz && userData.latestQuiz.id === quizId) {
                await setDoc(userDocRef, {
                    latestQuiz: {
                        aiAnalyzed: true,
                        riskLevel: aiAnalysis.riskLevel,
                        riskScore: aiAnalysis.riskScore
                    }
                }, { merge: true });
            }
        }
        
        return true;
    } catch (error) {
        console.error("Error updating quiz with AI analysis:", error);
        return false;
    }
}; 