'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';

export default function HistoryRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the health-history page
    router.push('/health-history');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <Heart className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-semibold text-gray-700">Redirecting to Health Assessment History...</h1>
      </div>
    </div>
  );
} 