import Sidebar from '@/components/Sidebar';
import React from 'react';

// TODO: Add authentication protection here

export default function DashboardLayout({
    children, // will be a page or nested layout
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-800"> {/* Apply base background */} 
            <Sidebar />
            {/* Main content area */}
            <main className="flex-1 overflow-y-auto p-5 md:p-10 bg-white dark:bg-gray-900"> {/* Content background */}
                {children}
            </main>
        </div>
    );
} 