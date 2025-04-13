import Sidebar from '@/components/Sidebar';
import React from 'react';

export default function AppointmentsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-800">
            <Sidebar />
            {/* Main content area */}
            <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-white dark:bg-gray-900">
                {children}
            </main>
        </div>
    );
} 