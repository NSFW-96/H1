import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '@/context/AuthContext';
import { DataSeedingProvider } from '@/context/DataSeedingContext';
import { inter, interLocal } from './font';

export const metadata: Metadata = {
  title: "Vitraya Health",
  description: "Your comprehensive health and wellness platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${interLocal.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <DataSeedingProvider>
            {children}
          </DataSeedingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
