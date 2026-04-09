'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import Link from 'next/link';
import {
    CheckCircle2, XCircle, Loader2, Clock,
    Coffee, UtensilsCrossed, Moon, AlertCircle, ArrowRight
} from 'lucide-react';

type Status = 'loading' | 'success' | 'duplicate' | 'expired' | 'invalid' | 'notloggedin' | 'error';

const MEAL_CONFIG: Record<string, { label: string; icon: JSX.Element; color: string; bg: string }> = {
    breakfast: { label: 'Breakfast', icon: <Coffee className="w-8 h-8" />, color: 'text-amber-600', bg: 'bg-amber-50' },
    lunch:     { label: 'Lunch',     icon: <UtensilsCrossed className="w-8 h-8" />, color: 'text-green-600', bg: 'bg-green-50' },
    dinner:    { label: 'Dinner',    icon: <Moon className="w-8 h-8" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
};

function CheckinContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('session');

    const [status, setStatus] = useState<Status>('loading');
    const [meal, setMeal] = useState('');
    const [studentName, setStudentName] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!sessionId) {
            setStatus('invalid');
            setMessage('No session ID found in this QR code.');
            return;
        }
        handleCheckin();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    const handleCheckin = async () => {
        try {
            const { getSession } = await import('next-auth/react');
            const sessionData = await getSession();
            
            if (!sessionData || !sessionData.user) {
                setStatus('notloggedin');
                return;
            }

            const res = await fetch('/api/student/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
            });
            
            const json = await res.json();
            
            setStatus(json.status);
            setMeal(json.meal || '');
            setStudentName(json.studentName || '');
            setMessage(json.message || '');

        } catch (err: any) {
            console.error('Checkin error:', err);
            setStatus('error');
            setMessage(err.message || 'Something went wrong. Please try again.');
        }
    };

    const mealConfig = meal ? MEAL_CONFIG[meal] : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">

                {/* Loading */}
                {status === 'loading' && (
                    <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">Verifying...</h1>
                        <p className="text-gray-500 mt-2 text-sm">Marking your attendance</p>
                    </div>
                )}

                {/* Success */}
                {status === 'success' && (
                    <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        {mealConfig && (
                            <div className={`inline-flex items-center gap-2 px-4 py-2 ${mealConfig.bg} ${mealConfig.color} rounded-full text-sm font-medium mb-4`}>
                                {mealConfig.icon}
                                {mealConfig.label}
                            </div>
                        )}
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Attendance Marked! ✅</h1>
                        <p className="text-gray-500 text-sm mb-2">
                            Welcome, <span className="font-semibold text-gray-700">{studentName}</span>
                        </p>
                        <p className="text-gray-400 text-xs mb-8">
                            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-6">
                            <p className="text-green-700 text-sm font-medium">Enjoy your {meal}! 🍽️</p>
                        </div>
                        <Link
                            href="/student"
                            className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl py-3 font-medium hover:bg-gray-800 transition-colors"
                        >
                            View Dashboard
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}

                {/* Duplicate */}
                {status === 'duplicate' && (
                    <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-10 h-10 text-amber-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Already Marked ⚠️</h1>
                        <p className="text-gray-500 text-sm mb-2">
                            Hi <span className="font-semibold text-gray-700">{studentName}</span>,
                        </p>
                        <p className="text-gray-500 text-sm mb-8">{message}</p>
                        <Link
                            href="/student"
                            className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl py-3 font-medium hover:bg-gray-800 transition-colors"
                        >
                            View Dashboard
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}

                {/* Expired */}
                {status === 'expired' && (
                    <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-10 h-10 text-red-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Expired</h1>
                        <p className="text-gray-500 text-sm mb-8">{message}</p>
                        <Link
                            href="/student"
                            className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl py-3 font-medium hover:bg-gray-800 transition-colors"
                        >
                            Go to Dashboard
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}

                {/* Not Logged In */}
                {status === 'notloggedin' && (
                    <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-10 h-10 text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h1>
                        <p className="text-gray-500 text-sm mb-8">
                            Please log in to mark your attendance. After logging in, scan the QR code again.
                        </p>
                        <Link
                            href={`/login?redirect=${encodeURIComponent(`/checkin?session=${sessionId}`)}`}
                            className="w-full inline-flex items-center justify-center gap-2 bg-red-600 text-white rounded-xl py-3 font-medium hover:bg-red-700 transition-colors"
                        >
                            Login & Come Back
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}

                {/* Invalid / Error */}
                {(status === 'invalid' || status === 'error') && (
                    <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-10 h-10 text-red-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {status === 'invalid' ? 'Invalid QR Code' : 'Error'}
                        </h1>
                        <p className="text-gray-500 text-sm mb-8">{message}</p>
                        <Link
                            href="/student"
                            className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl py-3 font-medium hover:bg-gray-800 transition-colors"
                        >
                            Go to Dashboard
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}

                <p className="text-center text-xs text-gray-400 mt-6">The Food Forge • Mess Management</p>
            </div>
        </div>
    );
}

export default function CheckinPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
            </div>
        }>
            <CheckinContent />
        </Suspense>
    );
}
