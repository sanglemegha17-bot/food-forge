import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Providers from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'The Food Forge : The Taste Buds',
    description: 'The Food Forge — Where Taste Buds Come Alive',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Providers>
                    <Navbar />
                    <main className="min-h-screen p-4 md:p-8">
                        {children}
                    </main>
                </Providers>
            </body>
        </html>
    );
}
