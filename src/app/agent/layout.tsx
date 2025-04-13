import Sidebar from '@/components/Sidebar';
import React from 'react';
import { cn } from '@/lib/utils';

export default function AgentLayout({
    children, // will be a page or nested layout
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={cn(
            "flex h-screen w-full overflow-hidden",
            "bg-gradient-to-br from-blue-50 via-white to-blue-50" // Subtle gradient background
        )}> 
            {/* Sidebar - hidden on mobile */}
            <Sidebar />
            
            {/* Main content area */}
            <main className="flex-1 overflow-hidden relative">
                {/* Background pattern - subtle grid */}
                <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,rgba(255,255,255,0.8),rgba(255,255,255,0.9))] -z-10"></div>
                
                {/* Actual content */}
                <div className="relative h-full z-10">
                    {children}
                </div>
            </main>
        </div>
    );
} 