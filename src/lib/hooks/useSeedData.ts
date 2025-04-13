import { useState, useEffect } from 'react';
import { firestore } from '@/lib/firebase/config';
import { collection, getDocs, addDoc, query, limit, Timestamp, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

// Sample doctors data
const sampleDoctors = [
    {
        name: "Jennifer Wilson",
        specialty: "General Practitioner",
        hospital: "City Community Hospital",
        experience: 12,
        education: "Harvard Medical School",
        rating: 4.9,
        description: "Dr. Wilson is a dedicated general practitioner with over 12 years of experience in family medicine.",
        languages: ["English", "Spanish"]
    },
    {
        name: "Michael Chen",
        specialty: "Cardiologist",
        hospital: "Heart & Vascular Institute",
        experience: 15,
        education: "Stanford University School of Medicine",
        rating: 4.8,
        description: "Dr. Chen specializes in treating cardiovascular diseases with a patient-centered approach.",
        languages: ["English", "Mandarin"]
    },
    {
        name: "Sarah Johnson",
        specialty: "Dermatologist",
        hospital: "Skin Health Center",
        experience: 10,
        education: "Johns Hopkins University",
        rating: 4.7,
        description: "Dr. Johnson is an expert in treating a wide range of skin conditions and performing cosmetic procedures.",
        languages: ["English"]
    },
    {
        name: "David Rodriguez",
        specialty: "Neurologist",
        hospital: "Brain & Spine Center",
        experience: 18,
        education: "Yale School of Medicine",
        rating: 4.9,
        description: "Dr. Rodriguez is a leading neurologist specializing in headache disorders and multiple sclerosis.",
        languages: ["English", "Spanish", "Portuguese"]
    },
    {
        name: "Emily Patel",
        specialty: "Pediatrician",
        hospital: "Children's Health Center",
        experience: 8,
        education: "University of Pennsylvania",
        rating: 4.8,
        description: "Dr. Patel is passionate about children's health and provides comprehensive pediatric care.",
        languages: ["English", "Hindi"]
    },
    {
        name: "Robert Thompson",
        specialty: "Orthopedist",
        hospital: "Sports Medicine & Orthopedic Center",
        experience: 14,
        education: "Columbia University",
        rating: 4.6,
        description: "Dr. Thompson specializes in sports injuries and joint replacements with minimally invasive techniques.",
        languages: ["English"]
    },
    {
        name: "Lisa Kim",
        specialty: "Gynecologist",
        hospital: "Women's Health Institute",
        experience: 11,
        education: "University of California, San Francisco",
        rating: 4.9,
        description: "Dr. Kim provides comprehensive women's health services with a focus on preventative care.",
        languages: ["English", "Korean"]
    },
    {
        name: "James Williams",
        specialty: "Psychiatrist",
        hospital: "Mental Health Center",
        experience: 16,
        education: "Duke University School of Medicine",
        rating: 4.7,
        description: "Dr. Williams specializes in mood disorders and utilizes evidence-based approaches to mental health.",
        languages: ["English"]
    }
];

// Sample health articles
const sampleArticles = [
    {
        title: "10 Ways to Improve Heart Health",
        category: "Cardio",
        readTime: "5 min read",
        content: "Heart disease is the leading cause of death globally. This article explores evidence-based strategies to improve cardiovascular health, including regular exercise, a heart-healthy diet, stress management, and regular check-ups.",
        author: "Dr. Michael Chen",
        publishedDate: Timestamp.fromDate(new Date(2023, 10, 1))
    },
    {
        title: "The Benefits of Mediterranean Diet",
        category: "Nutrition",
        readTime: "7 min read",
        content: "The Mediterranean diet is consistently ranked as one of the healthiest dietary patterns. Learn about its key components, health benefits, and how to incorporate it into your daily meals for better health outcomes.",
        author: "Emma Wilson, RD",
        publishedDate: Timestamp.fromDate(new Date(2023, 10, 5))
    },
    {
        title: "How to Maintain Exercise Motivation",
        category: "Fitness",
        readTime: "4 min read",
        content: "Starting an exercise routine is one thing, but maintaining it is another challenge. This article provides practical strategies to stay motivated, overcome common obstacles, and make physical activity a consistent part of your lifestyle.",
        author: "Mark Johnson, CPT",
        publishedDate: Timestamp.fromDate(new Date(2023, 10, 10))
    },
    {
        title: "Understanding Anxiety: Causes and Coping Strategies",
        category: "Mental Health",
        readTime: "8 min read",
        content: "Anxiety disorders affect millions of people worldwide. This article explains the different types of anxiety, their symptoms, and provides evidence-based strategies for managing anxiety in daily life.",
        author: "Dr. James Williams",
        publishedDate: Timestamp.fromDate(new Date(2023, 10, 15))
    },
    {
        title: "Sleep Better Tonight: Science-Backed Tips",
        category: "Wellness",
        readTime: "6 min read",
        content: "Quality sleep is essential for physical and mental health. Discover practical, science-backed tips to improve your sleep hygiene, create an optimal sleep environment, and develop habits that promote restful sleep.",
        author: "Dr. Jennifer Wilson",
        publishedDate: Timestamp.fromDate(new Date(2023, 10, 20))
    }
];

// Add sample user health data
const sampleUserHealthData = {
    latestQuiz: {
        bmi: 24.5,
        bmiCategory: "Healthy Weight",
        bmr: 1850,
        waterNeeded: 2.5,
        idealWeightMin: 65,
        idealWeightMax: 75,
        completedAt: Timestamp.fromDate(new Date(Date.now() - 86400000)), // Yesterday
        level: "Low",
        score: 85,
        physicalActivity: "moderate",
        sleep: "7-8",
        nutrition: "4-5",
        stress: "low"
    },
    streakDays: 5,
    completedGoals: 12,
    healthTracking: {
        weeklyActivity: [35, 45, 60, 40, 70, 55, 50],
        waterIntake: 75,
        sleepQuality: 85,
        nutrition: 80,
        todayActivity: 50
    },
    dailyTasks: {
        items: [
            { id: 'task1', title: 'Drink 8 glasses of water', completed: false },
            { id: 'task2', title: 'Exercise for 30 minutes', completed: false },
            { id: 'task3', title: 'Take medication', completed: false },
            { id: 'task4', title: 'Eat 2 servings of vegetables', completed: false },
            { id: 'task5', title: 'Get 7-8 hours of sleep', completed: false }
        ],
        lastUpdated: Timestamp.now()
    }
};

export function useSeedData() {
    const [seeding, setSeeding] = useState(false);
    const [seedingComplete, setSeedingComplete] = useState(false);
    const [seedingError, setSeedingError] = useState<string | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        async function seedDataIfNeeded() {
            // Only attempt to seed data if a user is logged in
            if (!user) {
                console.log("User not authenticated. Please log in to seed data.");
                setSeedingError("Authentication required. Please log in first.");
                return;
            }
            
            try {
                setSeeding(true);
                setSeedingError(null);
                
                // Check if doctors collection has data
                const doctorsRef = collection(firestore, 'doctors');
                const doctorsSnapshot = await getDocs(query(doctorsRef, limit(1)));
                
                // Seed doctors if no data exists
                if (doctorsSnapshot.empty) {
                    console.log("Seeding doctors data...");
                    
                    try {
                        // Add each doctor to the collection
                        for (const doctor of sampleDoctors) {
                            await addDoc(collection(firestore, 'doctors'), doctor);
                        }
                        
                        console.log("Doctors data seeded successfully!");
                    } catch (error) {
                        console.error("Error seeding doctors:", error);
                        setSeedingError(`Error seeding doctors: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
                
                // Check if articles collection has data
                const articlesRef = collection(firestore, 'articles');
                const articlesSnapshot = await getDocs(query(articlesRef, limit(1)));
                
                // Seed articles if no data exists
                if (articlesSnapshot.empty) {
                    console.log("Seeding articles data...");
                    
                    try {
                        // Add each article to the collection
                        for (const article of sampleArticles) {
                            await addDoc(collection(firestore, 'articles'), article);
                        }
                        
                        console.log("Articles data seeded successfully!");
                    } catch (error) {
                        console.error("Error seeding articles:", error);
                        setSeedingError(`Error seeding articles: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
                
                // Check if the current user has health data
                const userDocRef = doc(firestore, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists()) {
                    // Use only real user data, not seed data
                    console.log("User document exists - using real user data only");
                } else {
                    // Create empty user document if it doesn't exist
                    console.log("Creating new user document...");
                    try {
                        await setDoc(userDocRef, {
                            displayName: user.displayName || '',
                            email: user.email || '',
                            createdAt: Timestamp.now()
                        });
                        console.log("Empty user document created successfully!");
                    } catch (error) {
                        console.error("Error creating user document:", error);
                        setSeedingError(`Error creating user document: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
                
                setSeedingComplete(true);
            } catch (error) {
                console.error("Error seeding data:", error);
                setSeedingError(`Error during seeding process: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                setSeeding(false);
            }
        }
        
        seedDataIfNeeded();
    }, [user]);

    return {
        seeding,
        seedingComplete,
        seedingError
    };
} 