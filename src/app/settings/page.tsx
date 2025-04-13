'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/config';
import { Timestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import {
    User,
    Bell,
    Heart,
    Shield,
    Moon,
    Sun,
    ArrowLeft,
    LogOut,
    Save,
    Info,
    User as UserIcon,
    ChevronDown,
    Trash,
    AlertCircle,
    Eye,
    CheckCircle2
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import Link from 'next/link';

// Animation variants
const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4 }
    }
};

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
    // User profile settings
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [bio, setBio] = useState('');
    
    // Health preferences
    const [activityGoal, setActivityGoal] = useState('moderate');
    const [waterReminderEnabled, setWaterReminderEnabled] = useState(true);
    const [waterGoal, setWaterGoal] = useState('2.5');
    const [medicationRemindersEnabled, setMedicationRemindersEnabled] = useState(false);
    const [weightUnit, setWeightUnit] = useState('kg');
    const [heightUnit, setHeightUnit] = useState('cm');
    
    // Notification settings
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [appNotifications, setAppNotifications] = useState(true);
    const [healthTips, setHealthTips] = useState(true);
    const [appointmentReminders, setAppointmentReminders] = useState(true);
    
    // Display settings
    const [darkMode, setDarkMode] = useState(false);
    const [colorblindMode, setColorblindMode] = useState(false);
    const [fontSize, setFontSize] = useState('medium');
    
    useEffect(() => {
        async function loadUserSettings() {
            if (!user) {
                router.push('/login');
                return;
            }
            
            try {
                setLoading(true);
                setError(null);
                
                // Get user document from Firestore
                const userDocRef = doc(firestore, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    
                    // Load profile data
                    setDisplayName(userData.displayName || user.displayName || '');
                    setEmail(userData.email || user.email || '');
                    setPhone(userData.phone || '');
                    setBio(userData.bio || '');
                    
                    // Load health preferences
                    if (userData.healthPreferences) {
                        setActivityGoal(userData.healthPreferences.activityGoal || 'moderate');
                        setWaterReminderEnabled(userData.healthPreferences.waterReminderEnabled !== false);
                        setWaterGoal(userData.healthPreferences.waterGoal || '2.5');
                        setMedicationRemindersEnabled(userData.healthPreferences.medicationRemindersEnabled || false);
                        setWeightUnit(userData.healthPreferences.weightUnit || 'kg');
                        setHeightUnit(userData.healthPreferences.heightUnit || 'cm');
                    }
                    
                    // Load notification settings
                    if (userData.notificationSettings) {
                        setEmailNotifications(userData.notificationSettings.emailEnabled !== false);
                        setAppNotifications(userData.notificationSettings.appEnabled !== false);
                        setHealthTips(userData.notificationSettings.healthTips !== false);
                        setAppointmentReminders(userData.notificationSettings.appointmentReminders !== false);
                    }
                    
                    // Load display settings
                    if (userData.displaySettings) {
                        setDarkMode(userData.displaySettings.darkMode || false);
                        setColorblindMode(userData.displaySettings.colorblindMode || false);
                        setFontSize(userData.displaySettings.fontSize || 'medium');
                    }
                }
            } catch (err) {
                console.error("Error loading user settings:", err);
                setError("Failed to load your settings. Please try again.");
            } finally {
                setLoading(false);
            }
        }
        
        loadUserSettings();
    }, [user, router]);
    
    const handleSaveSettings = async () => {
        if (!user) return;
        
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);
            
            const userDocRef = doc(firestore, 'users', user.uid);
            
            await updateDoc(userDocRef, {
                displayName,
                phone,
                bio,
                healthPreferences: {
                    activityGoal,
                    waterReminderEnabled,
                    waterGoal,
                    medicationRemindersEnabled,
                    weightUnit,
                    heightUnit
                },
                notificationSettings: {
                    emailEnabled: emailNotifications,
                    appEnabled: appNotifications,
                    healthTips,
                    appointmentReminders
                },
                displaySettings: {
                    darkMode,
                    colorblindMode,
                    fontSize
                },
                updatedAt: Timestamp.now()
            });
            
            setSuccess("Settings saved successfully!");
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccess(null);
            }, 3000);
            
        } catch (err) {
            console.error("Error saving settings:", err);
            setError("Failed to save settings. Please try again.");
        } finally {
            setSaving(false);
        }
    };
    
    const handleDeleteAccount = async () => {
        // This would typically show a confirmation dialog
        // and then handle account deletion through Firebase Auth
        if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            try {
                // Handle account deletion logic here
                // For now, we'll just log out
                await logout();
                router.push('/login');
            } catch (err) {
                console.error("Error deleting account:", err);
                setError("Failed to delete account. Please try again.");
            }
        }
    };
    
    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[70vh]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="p-4 bg-blue-100 rounded-full mb-4">
                        <User className="h-8 w-8 text-blue-500" />
                    </div>
                    <p className="text-xl text-gray-700">Loading your settings...</p>
                </div>
            </div>
        );
    }
    
    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[70vh]">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Authentication Required</CardTitle>
                        <CardDescription>
                            Please log in to access your settings.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href="/login">Go to Login</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.push('/dashboard')}
                        className="mr-2"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-3xl font-bold">Settings</h1>
                </div>
                <Button 
                    onClick={handleSaveSettings} 
                    disabled={saving}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                    <Save className="h-4 w-4" />
                </Button>
            </div>
            
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <p>{error}</p>
                </div>
            )}
            
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <p>{success}</p>
                </div>
            )}
            
            <Tabs defaultValue="profile" className="mb-8">
                <TabsList className="mb-6">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="health" className="gap-2">
                        <Heart className="h-4 w-4" />
                        Health
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="display" className="gap-2">
                        <Sun className="h-4 w-4" />
                        Display
                    </TabsTrigger>
                    <TabsTrigger value="account" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Account
                    </TabsTrigger>
                </TabsList>
                
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                >
                    <TabsContent value="profile" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile Information</CardTitle>
                                <CardDescription>
                                    Update your personal information
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="displayName">Full Name</Label>
                                    <Input 
                                        id="displayName" 
                                        placeholder="Your name"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input 
                                        id="email" 
                                        placeholder="your.email@example.com"
                                        value={email}
                                        disabled
                                        className="bg-gray-50"
                                    />
                                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input 
                                        id="phone" 
                                        placeholder="Your phone number"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="bio">About Me</Label>
                                    <Textarea 
                                        id="bio" 
                                        placeholder="Share a little about yourself"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="health" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Health Preferences</CardTitle>
                                <CardDescription>
                                    Customize your health tracking settings
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="activityGoal">Daily Activity Goal</Label>
                                    <Select value={activityGoal} onValueChange={setActivityGoal}>
                                        <SelectTrigger id="activityGoal">
                                            <SelectValue placeholder="Select your activity goal" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="light">Light (30 min/day)</SelectItem>
                                            <SelectItem value="moderate">Moderate (60 min/day)</SelectItem>
                                            <SelectItem value="intense">Intense (90+ min/day)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="water-reminders">Water Intake Reminders</Label>
                                            <p className="text-sm text-gray-500">
                                                Receive reminders to drink water throughout the day
                                            </p>
                                        </div>
                                        <Switch 
                                            id="water-reminders" 
                                            checked={waterReminderEnabled}
                                            onCheckedChange={setWaterReminderEnabled}
                                        />
                                    </div>
                                    
                                    {waterReminderEnabled && (
                                        <div className="space-y-2 ml-6 border-l-2 border-gray-100 pl-4">
                                            <Label htmlFor="waterGoal">Daily Water Goal (liters)</Label>
                                            <Select value={waterGoal} onValueChange={setWaterGoal}>
                                                <SelectTrigger id="waterGoal">
                                                    <SelectValue placeholder="Select your water goal" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1.5">1.5 L</SelectItem>
                                                    <SelectItem value="2.0">2.0 L</SelectItem>
                                                    <SelectItem value="2.5">2.5 L</SelectItem>
                                                    <SelectItem value="3.0">3.0 L</SelectItem>
                                                    <SelectItem value="3.5">3.5 L</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center justify-between pt-2">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="medication-reminders">Medication Reminders</Label>
                                        <p className="text-sm text-gray-500">
                                            Set up reminders for taking medications
                                        </p>
                                    </div>
                                    <Switch 
                                        id="medication-reminders" 
                                        checked={medicationRemindersEnabled}
                                        onCheckedChange={setMedicationRemindersEnabled}
                                    />
                                </div>
                                
                                <Separator className="my-4" />
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="weightUnit">Weight Unit</Label>
                                        <Select value={weightUnit} onValueChange={setWeightUnit}>
                                            <SelectTrigger id="weightUnit">
                                                <SelectValue placeholder="Select weight unit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                                <SelectItem value="lb">Pounds (lb)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="heightUnit">Height Unit</Label>
                                        <Select value={heightUnit} onValueChange={setHeightUnit}>
                                            <SelectTrigger id="heightUnit">
                                                <SelectValue placeholder="Select height unit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cm">Centimeters (cm)</SelectItem>
                                                <SelectItem value="ft">Feet & Inches (ft/in)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="notifications" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Settings</CardTitle>
                                <CardDescription>
                                    Manage how you receive updates and reminders
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Email Notifications</Label>
                                        <p className="text-sm text-gray-500">
                                            Receive important health updates via email
                                        </p>
                                    </div>
                                    <Switch 
                                        checked={emailNotifications}
                                        onCheckedChange={setEmailNotifications}
                                    />
                                </div>
                                
                                <Separator />
                                
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">App Notifications</Label>
                                        <p className="text-sm text-gray-500">
                                            Receive push notifications in the app
                                        </p>
                                    </div>
                                    <Switch 
                                        checked={appNotifications}
                                        onCheckedChange={setAppNotifications}
                                    />
                                </div>
                                
                                <div className="space-y-4 ml-6 border-l-2 border-gray-100 pl-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm">Health Tips & Insights</Label>
                                        <Switch 
                                            checked={healthTips}
                                            onCheckedChange={setHealthTips}
                                            disabled={!appNotifications}
                                        />
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm">Appointment Reminders</Label>
                                        <Switch 
                                            checked={appointmentReminders}
                                            onCheckedChange={setAppointmentReminders}
                                            disabled={!appNotifications}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="display" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Display Settings</CardTitle>
                                <CardDescription>
                                    Customize the appearance of the app
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Moon className="h-5 w-5" />
                                        <div>
                                            <Label className="text-base">Dark Mode</Label>
                                            <p className="text-sm text-gray-500">
                                                Use dark theme for the application
                                            </p>
                                        </div>
                                    </div>
                                    <Switch 
                                        checked={darkMode}
                                        onCheckedChange={setDarkMode}
                                    />
                                </div>
                                
                                <Separator />
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Eye className="h-5 w-5" />
                                        <div>
                                            <Label className="text-base">Colorblind Mode</Label>
                                            <p className="text-sm text-gray-500">
                                                Use colorblind-friendly color scheme
                                            </p>
                                        </div>
                                    </div>
                                    <Switch 
                                        checked={colorblindMode}
                                        onCheckedChange={setColorblindMode}
                                    />
                                </div>
                                
                                <Separator />
                                
                                <div className="space-y-2">
                                    <Label htmlFor="fontSize">Text Size</Label>
                                    <Select value={fontSize} onValueChange={setFontSize}>
                                        <SelectTrigger id="fontSize">
                                            <SelectValue placeholder="Select text size" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="small">Small</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="large">Large</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="account" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Management</CardTitle>
                                <CardDescription>
                                    Manage your account settings
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Accordion type="single" collapsible>
                                    <AccordionItem value="password">
                                        <AccordionTrigger>Change Password</AccordionTrigger>
                                        <AccordionContent className="pt-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="currentPassword">Current Password</Label>
                                                <Input id="currentPassword" type="password" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="newPassword">New Password</Label>
                                                <Input id="newPassword" type="password" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                                <Input id="confirmPassword" type="password" />
                                            </div>
                                            <Button className="mt-2">Update Password</Button>
                                        </AccordionContent>
                                    </AccordionItem>
                                    
                                    <AccordionItem value="export">
                                        <AccordionTrigger>Export Data</AccordionTrigger>
                                        <AccordionContent className="pt-4">
                                            <p className="text-sm text-gray-600 mb-4">
                                                You can export all your health data as a JSON file. This includes 
                                                your health records, activities, and preferences.
                                            </p>
                                            <Button variant="outline">Export My Data</Button>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                                
                                <Separator className="my-4" />
                                
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-red-600">Danger Zone</h3>
                                    
                                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium text-red-800">Delete Account</h4>
                                                <p className="text-sm text-red-600">
                                                    Permanently delete your account and all your data. This action cannot be undone.
                                                </p>
                                            </div>
                                            <Button 
                                                variant="destructive" 
                                                onClick={handleDeleteAccount}
                                                className="gap-2"
                                            >
                                                <Trash className="h-4 w-4" />
                                                Delete Account
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Button 
                            onClick={logout} 
                            variant="outline" 
                            className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </Button>
                    </TabsContent>
                </motion.div>
            </Tabs>
        </div>
    );
} 