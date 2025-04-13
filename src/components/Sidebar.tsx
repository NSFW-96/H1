'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { cn } from "@/lib/utils" // shadcn utility for conditional classes
import { Button } from "@/components/ui/button"
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import Logo from '@/components/Logo';

// Import icons from lucide-react
import {
    LayoutDashboard,
    ClipboardList, // Icon for the Quiz
    History,       // Icon for History
    User,          // Icon for Profile
    LogOut,        // Icon for Logout
    Bot,           // Icon for Health Coach AI
    ChevronRight,
    X,             // Close icon for mobile
    Settings,      // Settings icon
    Calendar,      // Icon for Appointments
    Info,          // Icon for About Us
    Menu,          // Hamburger menu icon
} from 'lucide-react';

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname(); // Hook to get current path
    const { user } = useAuth(); // Get current user from AuthContext
    const [mounted, setMounted] = useState(false);

    // Handle mobile sidebar
    useEffect(() => {
        setMounted(true);
        
        // Add CSS for mobile sidebar sliding
        const style = document.createElement('style');
        style.innerHTML = `
            @media (max-width: 768px) {
                .sidebar {
                    transform: translateX(-100%);
                    transition: transform 0.3s ease-in-out;
                    position: fixed;
                    z-index: 50;
                    height: 100vh;
                }
                .sidebar-open .sidebar {
                    transform: translateX(0);
                }
                .sidebar-backdrop {
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.3s ease-in-out;
                }
                .sidebar-open .sidebar-backdrop {
                    opacity: 1;
                    pointer-events: auto;
                }
                
                /* Mobile navigation bar */
                .mobile-navbar {
                    display: flex;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 56px;
                    background: white;
                    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
                    z-index: 40;
                    border-top: 1px solid rgba(0, 0, 0, 0.05);
                }
                
                /* Add padding to the main content area */
                main {
                    padding-bottom: 80px !important;
                }
            }
        `;
        document.head.appendChild(style);

        // Close sidebar when route changes on mobile
        const closeSidebarOnRouteChange = () => {
            document.documentElement.classList.remove('sidebar-open');
        };

        // Listen for route changes
        window.addEventListener('popstate', closeSidebarOnRouteChange);

        return () => {
            window.removeEventListener('popstate', closeSidebarOnRouteChange);
            document.head.removeChild(style);
        };
    }, []);

    // Close sidebar function for mobile
    const closeSidebar = () => {
        document.documentElement.classList.remove('sidebar-open');
    };
    
    // Open sidebar function for mobile
    const openSidebar = () => {
        document.documentElement.classList.add('sidebar-open');
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login'); // Redirect to login page after logout
            closeSidebar(); // Close sidebar on mobile
        } catch (error) {
            console.error("Logout Error:", error);
            // Handle logout error (e.g., show a notification)
        }
    };

    const navItems = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: <LayoutDashboard className="w-5 h-5" />
        },
        {
            name: 'Health Quiz',
            href: '/quiz',
            icon: <ClipboardList className="w-5 h-5" />
        },
        {
            name: 'Appointments',
            href: '/appointments',
            icon: <Calendar className="w-5 h-5" />
        },
        {
            name: 'Vitraya Coach',
            href: '/agent',
            icon: <Bot className="w-5 h-5" />
        },
        {
            name: 'Health Records',
            href: '/history',
            icon: <History className="w-5 h-5" />
        }
    ];

    // Get user initials for avatar
    const getUserInitials = () => {
        if (!user || !user.email) return 'U';
        
        if (user.displayName) {
            const names = user.displayName.split(' ');
            if (names.length >= 2) {
                return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
            }
            return user.displayName[0].toUpperCase();
        }
        
        // If no display name, use first character of email
        return user.email[0].toUpperCase();
    };

    if (!mounted) {
        return null;
    }

    return (
        <>
            {/* Mobile backdrop */}
            <div 
                className="fixed inset-0 bg-black/50 z-40 sidebar-backdrop hidden md:hidden"
                onClick={closeSidebar}
                aria-hidden="true"
            ></div>
            
            {/* Mobile Navigation Bar */}
            <div className="mobile-navbar md:hidden">
                <div className="flex justify-around items-center w-full">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center justify-center flex-1",
                                    isActive ? "text-blue-600" : "text-gray-500"
                                )}
                                aria-label={item.name}
                            >
                                <div className={cn(
                                    "flex items-center justify-center rounded-full p-2",
                                    isActive ? "bg-blue-100" : ""
                                )}>
                                    {item.icon}
                                </div>
                            </Link>
                        );
                    })}
                    <button
                        className="flex items-center justify-center flex-1 text-gray-500"
                        onClick={openSidebar}
                        aria-label="Menu"
                    >
                        <div className="flex items-center justify-center p-2">
                            <Menu className="w-5 h-5" />
                        </div>
                    </button>
                </div>
            </div>
            
            {/* Sidebar - default hidden on mobile, shown with .sidebar-open class */}
            <div className="sidebar flex h-full w-64 flex-col bg-white border-r shadow-md"> 
                <div className="flex h-full flex-col">
                    {/* Header with logo */}
                    <div className="flex h-20 items-center px-6 border-b border-gray-100"> 
                        <Link href="/dashboard" className="flex items-center gap-3 w-full">
                            <Logo size={36} />
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-900">Vitraya</span>
                                <span className="text-xs text-gray-500">Personal wellness guide</span>
                            </div>
                        </Link>
                        
                        {/* Mobile close button */}
                        <button 
                            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                            onClick={closeSidebar}
                            aria-label="Close menu"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex-1 pt-6 overflow-y-auto">
                        <div className="px-4 mb-3">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3">
                                Main Menu
                            </p>
                        </div>
                        <nav className="space-y-1 px-3">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center justify-between py-3 px-4 rounded-xl transition-all group",
                                            isActive 
                                                ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-medium shadow-sm" 
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        )}
                                        onClick={() => {
                                            if (window.innerWidth < 768) {
                                                closeSidebar();
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
                                                isActive 
                                                    ? "bg-blue-500 text-white" 
                                                    : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                                            )}>
                                                {item.icon}
                                            </div>
                                            <span>{item.name}</span>
                                        </div>
                                        {isActive && <ChevronRight className="h-4 w-4 text-blue-500" />}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="pt-6"></div>
                    </div>

                    {/* User info and logout */}
                    <div className="border-t p-4 mt-auto">
                        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white h-10 w-10 rounded-xl shadow-sm flex items-center justify-center font-medium text-sm">
                                {getUserInitials()}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-900">
                                    {user?.displayName || 'User'}
                                </div>
                                <div className="text-xs text-gray-500 truncate max-w-[140px]">
                                    {user?.email || 'user@example.com'}
                                </div>
                            </div>
                        </div>
                         
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full justify-between text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 rounded-xl transition-colors" 
                            onClick={handleLogout}
                        >
                            <div className="flex items-center gap-2">
                                <LogOut className="h-4 w-4" />
                                <span>Logout</span>
                            </div>
                            <ChevronRight className="h-4 w-4 opacity-50" />
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
} 