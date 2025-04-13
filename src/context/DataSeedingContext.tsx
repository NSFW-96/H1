'use client';

import React, { createContext, useContext } from 'react';
import { useSeedData } from '@/lib/hooks/useSeedData';

interface DataSeedingContextType {
    seeding: boolean;
    seedingComplete: boolean;
}

const DataSeedingContext = createContext<DataSeedingContextType>({
    seeding: false,
    seedingComplete: false
});

export function useDataSeeding() {
    return useContext(DataSeedingContext);
}

export function DataSeedingProvider({ children }: { children: React.ReactNode }) {
    const { seeding, seedingComplete } = useSeedData();
    
    return (
        <DataSeedingContext.Provider value={{ seeding, seedingComplete }}>
            {children}
        </DataSeedingContext.Provider>
    );
} 