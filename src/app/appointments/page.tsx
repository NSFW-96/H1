'use client';

import { useState, useEffect } from 'react';
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar, Clock, User, CalendarCheck, X, Search, Filter, ChevronRight, MapPin, Phone, Mail, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, getDocs, addDoc, where, orderBy, Timestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/config';
import Link from 'next/link';
import { motion } from 'framer-motion';

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

// Specialties list
const specialties = [
    "General Practitioner",
    "Cardiologist",
    "Dermatologist",
    "Neurologist",
    "Pediatrician",
    "Orthopedist",
    "Gynecologist",
    "Psychiatrist",
    "Ophthalmologist",
    "Dentist"
];

// Time slots
const timeSlots = [
    "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM"
];

// Define appointment type at the top of the file, after the imports section
type Appointment = {
    id: string;
    userId: string;
    doctorId: string;
    doctorName: string;
    specialty: string;
    date: string;
    time: string;
    type: string;
    status: string;
    createdAt: any; // Using 'any' for Timestamp type for simplicity
};

export default function AppointmentsPage() {
    const { user, loading: authLoading } = useAuth();
    const [doctors, setDoctors] = useState<any[]>([]);
    const [filteredDoctors, setFilteredDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingStep, setBookingStep] = useState(1);

    // Fetch doctors and user's appointments
    useEffect(() => {
        async function fetchData() {
            if (!user) return;
            
            try {
                setLoading(true);
                setError(null);
                
                // Fetch doctors
                const doctorsRef = collection(firestore, 'doctors');
                const doctorsQuery = query(doctorsRef, orderBy('name'));
                const doctorsSnapshot = await getDocs(doctorsQuery);
                
                const doctorsData: any[] = [];
                doctorsSnapshot.forEach((doc) => {
                    doctorsData.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                setDoctors(doctorsData);
                setFilteredDoctors(doctorsData);
                
                // Fetch user's appointments
                await fetchUserAppointments();
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load doctors. Please try again later.");
            } finally {
                setLoading(false);
            }
        }
        
        fetchData();
    }, [user]);

    // Function to fetch user appointments from Firestore
    const fetchUserAppointments = async () => {
        if (!user) return;
        
        try {
            setLoading(true);
            console.log("Current user ID:", user.uid); // Debug: Log current user ID
            
            const appointmentsRef = collection(firestore, "appointments");
            
            // Use two separate queries to ensure we get only the current user's appointments
            // First, get all appointments to check what's in the database
            const allAppointmentsQuery = query(appointmentsRef);
            const allSnapshot = await getDocs(allAppointmentsQuery);
            console.log("All appointments in DB:", allSnapshot.size);
            
            // Now get only this user's appointments
            const userAppointmentsQuery = query(
                appointmentsRef,
                where("userId", "==", user.uid)
            );
            
            const querySnapshot = await getDocs(userAppointmentsQuery);
            console.log("Filtered appointments:", querySnapshot.size);
            
            // Map appointments and do a final JS-side filter to be extra safe
            const appointmentsData = querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Appointment))
                .filter(appointment => appointment.userId === user.uid);
            
            console.log("Final filtered appointments:", appointmentsData.length);
            setAppointments(appointmentsData);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching appointments:", error);
            setError("Failed to load your appointments. Please try again later.");
            setLoading(false);
        }
    };

    // Filter doctors based on search term and specialty
    useEffect(() => {
        if (doctors.length === 0) return;
        
        let filtered = [...doctors];
        
        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(doctor => 
                doctor.name.toLowerCase().includes(term) || 
                (doctor.specialty && doctor.specialty.toLowerCase().includes(term))
            );
        }
        
        // Filter by specialty
        if (selectedSpecialty) {
            filtered = filtered.filter(doctor => 
                doctor.specialty === selectedSpecialty
            );
        }
        
        setFilteredDoctors(filtered);
    }, [searchTerm, selectedSpecialty, doctors]);

    // Book appointment
    async function bookAppointment() {
        if (!user || !selectedDoctor || !selectedDate || !selectedTime) {
            return;
        }
        
        try {
            setLoading(true);
            
            // Create appointment document
            const appointmentData = {
                userId: user.uid,
                doctorId: selectedDoctor.id,
                doctorName: selectedDoctor.name,
                specialty: selectedDoctor.specialty,
                date: selectedDate,
                time: selectedTime,
                type: `${selectedDoctor.specialty} Consultation`,
                status: 'scheduled',
                createdAt: Timestamp.now()
            };
            
            await addDoc(collection(firestore, 'appointments'), appointmentData);
            
            // Refresh appointments
            await fetchUserAppointments();
            
            // Reset selection and show success
            setBookingSuccess(true);
            setTimeout(() => {
                setBookingSuccess(false);
                setSelectedDoctor(null);
                setSelectedDate('');
                setSelectedTime('');
                setBookingStep(1);
            }, 3000);
        } catch (error) {
            console.error("Error booking appointment:", error);
            setError("Failed to book appointment. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    // Format date for display
    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }

    // Show loading state
    if (authLoading || loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="relative w-20 h-20 mb-4">
                        <Calendar className="w-20 h-20 text-purple-500 animate-pulse" />
                    </div>
                    <p className="text-xl font-medium text-gray-700">Loading appointments...</p>
                </div>
            </div>
        );
    }
    
    // Show message if user is not logged in
    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Card className="w-full max-w-md shadow-lg border-0">
                    <CardHeader className="pb-4">
                        <div className="flex justify-center mb-4">
                            <div className="relative w-16 h-16">
                                <Calendar className="w-16 h-16 text-purple-500" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl text-center">Authentication Required</CardTitle>
                        <CardDescription className="text-center text-base">
                            Please log in to book appointments.
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

    // Booking flow when a doctor is selected
    if (selectedDoctor) {
        return (
            <motion.div 
                className="space-y-6 max-w-4xl mx-auto px-4 py-8"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
            >
                {bookingSuccess ? (
                    <motion.div variants={fadeIn} className="text-center py-12">
                        <div className="inline-flex p-4 bg-green-100 rounded-full text-green-500 mb-4">
                            <Check className="h-12 w-12" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Appointment Booked!</h2>
                        <p className="text-gray-600 mb-6">
                            Your appointment with Dr. {selectedDoctor.name} has been scheduled for {formatDate(selectedDate)} at {selectedTime}.
                        </p>
                        <Button 
                            onClick={() => {
                                setSelectedDoctor(null);
                                setSelectedDate('');
                                setSelectedTime('');
                                setBookingStep(1);
                            }}
                            className="bg-gradient-to-r from-purple-500 to-purple-600"
                        >
                            Back to Appointments
                        </Button>
                    </motion.div>
                ) : (
                    <>
                        <motion.div variants={fadeIn} className="flex items-center justify-between">
                            <Button 
                                variant="ghost" 
                                onClick={() => {
                                    if (bookingStep > 1) {
                                        setBookingStep(bookingStep - 1);
                                    } else {
                                        setSelectedDoctor(null);
                                    }
                                }}
                                className="gap-2"
                            >
                                <X className="h-4 w-4" /> 
                                {bookingStep > 1 ? 'Back' : 'Cancel'}
                            </Button>
                            <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${bookingStep >= 1 ? 'bg-purple-500' : 'bg-gray-300'}`}></span>
                                <span className={`h-2.5 w-2.5 rounded-full ${bookingStep >= 2 ? 'bg-purple-500' : 'bg-gray-300'}`}></span>
                                <span className={`h-2.5 w-2.5 rounded-full ${bookingStep >= 3 ? 'bg-purple-500' : 'bg-gray-300'}`}></span>
                            </div>
                        </motion.div>

                        {bookingStep === 1 && (
                            <motion.div variants={fadeIn}>
                                <Card className="border-0 shadow-md">
                                    <CardHeader>
                                        <CardTitle>Select Appointment Date</CardTitle>
                                        <CardDescription>Choose a date for your appointment with Dr. {selectedDoctor.name}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-6">
                                            <div>
                                                <Label htmlFor="appointment-date">Appointment Date</Label>
                                                <Input 
                                                    id="appointment-date" 
                                                    type="date" 
                                                    min={new Date().toISOString().split('T')[0]}
                                                    value={selectedDate}
                                                    onChange={(e) => setSelectedDate(e.target.value)}
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button 
                                            onClick={() => selectedDate && setBookingStep(2)} 
                                            disabled={!selectedDate}
                                            className="ml-auto bg-gradient-to-r from-purple-500 to-purple-600"
                                        >
                                            Next: Select Time
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        )}

                        {bookingStep === 2 && (
                            <motion.div variants={fadeIn}>
                                <Card className="border-0 shadow-md">
                                    <CardHeader>
                                        <CardTitle>Select Appointment Time</CardTitle>
                                        <CardDescription>Choose an available time slot for {formatDate(selectedDate)}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {timeSlots.map((time) => (
                                                <Button
                                                    key={time}
                                                    variant={selectedTime === time ? "default" : "outline"}
                                                    className={selectedTime === time ? "bg-purple-500 hover:bg-purple-600" : ""}
                                                    onClick={() => setSelectedTime(time)}
                                                >
                                                    {time}
                                                </Button>
                                            ))}
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button 
                                            onClick={() => selectedTime && setBookingStep(3)} 
                                            disabled={!selectedTime}
                                            className="ml-auto bg-gradient-to-r from-purple-500 to-purple-600"
                                        >
                                            Next: Review
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        )}

                        {bookingStep === 3 && (
                            <motion.div variants={fadeIn}>
                                <Card className="border-0 shadow-md">
                                    <CardHeader>
                                        <CardTitle>Review & Confirm</CardTitle>
                                        <CardDescription>Please review your appointment details</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
                                                <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-500">
                                                    <User className="h-8 w-8" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium">Dr. {selectedDoctor.name}</h3>
                                                    <p className="text-sm text-gray-500">{selectedDoctor.specialty}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center gap-2 text-purple-500 mb-2">
                                                        <Calendar className="h-5 w-5" />
                                                        <span className="font-medium">Date</span>
                                                    </div>
                                                    <p>{formatDate(selectedDate)}</p>
                                                </div>
                                                
                                                <div className="p-4 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center gap-2 text-purple-500 mb-2">
                                                        <Clock className="h-5 w-5" />
                                                        <span className="font-medium">Time</span>
                                                    </div>
                                                    <p>{selectedTime}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                                                <p className="text-sm text-yellow-800">
                                                    By confirming this appointment, you agree to our cancellation policy. Please arrive 15 minutes before your scheduled time.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button 
                                            onClick={bookAppointment} 
                                            className="ml-auto bg-gradient-to-r from-purple-500 to-purple-600"
                                            disabled={loading}
                                        >
                                            {loading ? 'Booking...' : 'Confirm Appointment'}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        )}
                    </>
                )}
            </motion.div>
        );
    }

    return (
        <motion.div 
            className="space-y-6 max-w-6xl mx-auto px-4 py-8"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
        >
            <motion.div variants={fadeIn} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Book an Appointment</h1>
                    <p className="text-gray-500">Find and book appointments with healthcare professionals</p>
                </div>
            </motion.div>

            {error && (
                <motion.div variants={fadeIn} className="bg-red-50 text-red-800 p-4 rounded-lg">
                    {error}
                </motion.div>
            )}

            {appointments.length > 0 && (
                <motion.div variants={fadeIn}>
                    <Card className="border-0 shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarCheck className="h-5 w-5 text-purple-500" /> 
                                Your Upcoming Appointments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {appointments.slice(0, 3).map((appointment) => (
                                    <div 
                                        key={appointment.id} 
                                        className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-white rounded-lg border border-purple-100"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-purple-100 rounded-full text-purple-500">
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium">{appointment.type}</h4>
                                                <p className="text-sm text-gray-500">With Dr. {appointment.doctorName}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">{appointment.date}</p>
                                            <p className="text-sm text-gray-500">{appointment.time}</p>
                                        </div>
                                    </div>
                                ))}
                                
                                {appointments.length > 3 && (
                                    <p className="text-sm text-center text-gray-500">
                                        + {appointments.length - 3} more appointments
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            <motion.div variants={fadeIn}>
                <Card className="border-0 shadow-md">
                    <CardHeader>
                        <CardTitle>Find a Doctor</CardTitle>
                        <CardDescription>Search for doctors by name or specialty</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input 
                                    placeholder="Search by name or specialty..." 
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
                                    <Filter className="h-4 w-4" /> 
                                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                                </Button>
                            </div>
                        </div>

                        {showFilters && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-medium mb-3">Filter by Specialty</h3>
                                <RadioGroup value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="" id="all" />
                                            <Label htmlFor="all">All Specialties</Label>
                                        </div>

                                        {specialties.map((specialty) => (
                                            <div key={specialty} className="flex items-center space-x-2">
                                                <RadioGroupItem value={specialty} id={specialty.toLowerCase().replace(/\s+/g, '-')} />
                                                <Label htmlFor={specialty.toLowerCase().replace(/\s+/g, '-')}>{specialty}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>
                        )}

                        {filteredDoctors.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-medium mb-2">No doctors found</h3>
                                <p>Try adjusting your search criteria</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredDoctors.map((doctor) => (
                                    <Card key={doctor.id} className="overflow-hidden border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all">
                                        <CardContent className="p-0">
                                            <div className="p-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 flex-shrink-0">
                                                        <User className="h-8 w-8" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium text-lg">Dr. {doctor.name}</h3>
                                                        <p className="text-purple-600">{doctor.specialty}</p>
                                                        
                                                        <div className="mt-2 space-y-1">
                                                            {doctor.hospital && (
                                                                <div className="flex items-center text-sm text-gray-500">
                                                                    <MapPin className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                                                    {doctor.hospital}
                                                                </div>
                                                            )}
                                                            {doctor.experience && (
                                                                <p className="text-sm text-gray-500">
                                                                    {doctor.experience} years of experience
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Calendar className="h-4 w-4 text-purple-500" />
                                                    Next Available: Today
                                                </div>
                                                <Button 
                                                    size="sm" 
                                                    onClick={() => setSelectedDoctor(doctor)}
                                                    className="bg-gradient-to-r from-purple-500 to-purple-600"
                                                >
                                                    Book Now
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
} 