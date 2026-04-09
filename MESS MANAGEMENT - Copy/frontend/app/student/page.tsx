'use client';
import { useEffect, useState } from 'react';
import { getSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import dynamic from 'next/dynamic';
import {
    Loader2, LogOut, CheckCircle2, Clock,
    Home, QrCode, Calendar, Camera, AlertCircle, DollarSign, History, Coffee, UtensilsCrossed, Moon
} from 'lucide-react';

const QRScanner = dynamic(() => import('@/components/QRScanner'), { ssr: false });

export default function StudentDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'home' | 'scanner' | 'payments'>('home');
    const [showScanner, setShowScanner] = useState(false);
    const [scanResult, setScanResult] = useState<{success: boolean; message: string} | null>(null);
    const [checkingIn, setCheckingIn] = useState(false);
    const [payments, setPayments] = useState<any[]>([]);
    const [menu, setMenu] = useState<{breakfast: string; lunch: string; dinner: string}>({ breakfast: '', lunch: '', dinner: '' });

    useEffect(() => {
        const fetchData = async () => {
            const session = await getSession();
            if (!session || !session.user) {
                router.push('/login');
                return;
            }
            setUser(session.user);
            
            try {
                const [payRes, menuRes] = await Promise.all([
                    fetch('/api/student/payments'),
                    fetch('/api/admin/menu')
                ]);
                const payJson = await payRes.json();
                const menuJson = await menuRes.json();
                
                if (payRes.ok) setPayments(payJson.payments || []);
                if (menuRes.ok) {
                    const b = menuJson.items.filter((i: any) => i.meal === 'breakfast').map((i: any) => i.item_name).join(', ');
                    const l = menuJson.items.filter((i: any) => i.meal === 'lunch').map((i: any) => i.item_name).join(', ');
                    const d = menuJson.items.filter((i: any) => i.meal === 'dinner').map((i: any) => i.item_name).join(', ');
                    setMenu({ breakfast: b, lunch: l, dinner: d });
                }
            } catch (e) {
                console.error("Failed to fetch dashboard data", e);
            }

            setLoading(false);
        };
        fetchData();
    }, [router]);

    const handleScan = async (data: string) => {
        setCheckingIn(true);
        setShowScanner(false);
        try {
            let sessionId = data;
            try {
                const url = new URL(data);
                sessionId = url.searchParams.get('session') || data;
            } catch (e) {}

            const res = await fetch('/api/student/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });

            const json = await res.json();
            
            if (json.status === 'success') {
                setScanResult({ success: true, message: `Attendance marked successfully for ${json.meal}!` });
            } else if (json.status === 'duplicate') {
                setScanResult({ success: false, message: json.message });
            } else {
                setScanResult({ success: false, message: json.message || 'Failed to mark attendance.' });
            }
        } catch (err: any) {
            console.error(err);
            setScanResult({ success: false, message: 'Invalid scan data or network error.' });
        } finally {
            setCheckingIn(false);
            setTimeout(() => setScanResult(null), 4000);
        }
    };

    const handleLogout = async () => {
        await signOut({ redirect: false });
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="animate-spin text-red-600 mx-auto" size={40} />
                </div>
            </div>
        );
    }

    const userName = user?.name || 'Student';
    const hour = new Date().getHours();

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Hello, {userName} 👋</h1>
                        <p className="text-sm text-gray-500">
                            Welcome to the student dashboard
                        </p>
                    </div>
                    <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600 transition-colors bg-white rounded-xl shadow-sm border border-gray-100">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                
                {scanResult && (
                    <div className={`p-4 rounded-xl flex items-start gap-3 shadow-sm ${scanResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {scanResult.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                        <p className="font-medium text-sm">{scanResult.message}</p>
                    </div>
                )}

                {checkingIn && (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                        <span className="ml-3 font-medium text-gray-700">Connecting...</span>
                    </div>
                )}

                {activeTab === 'home' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="card p-6 text-center">
                            <div className="text-sm font-medium text-gray-500 mb-4">Mark Attendance</div>
                            <button
                                onClick={() => setShowScanner(true)}
                                className="mx-auto w-40 h-40 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-[2.5rem] shadow-xl shadow-red-500/20 text-white flex flex-col items-center justify-center gap-4 transition-transform active:scale-95"
                            >
                                <Camera className="w-12 h-12" />
                                <span className="font-bold text-lg">Scan QR</span>
                            </button>
                            <p className="text-sm text-gray-500 mt-6 font-medium">Point your camera at the Admin's screen to mark your attendance!</p>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-bold text-gray-900">Today's Menu</h2>
                        </div>

                        <div className="grid gap-3 stagger-children">
                            <MealCard
                                icon={<Coffee className="w-5 h-5" />}
                                title="Breakfast"
                                time="7:30 - 9:30 AM"
                                items={menu.breakfast || 'No menu set yet'}
                                status={hour >= 10 ? 'done' : hour >= 6 ? 'active' : 'upcoming'}
                            />
                            <MealCard
                                icon={<UtensilsCrossed className="w-5 h-5" />}
                                title="Lunch"
                                time="12:30 - 2:30 PM"
                                items={menu.lunch || 'No menu set yet'}
                                status={hour >= 15 ? 'done' : hour >= 11 ? 'active' : 'upcoming'}
                            />
                            <MealCard
                                icon={<Moon className="w-5 h-5" />}
                                title="Dinner"
                                time="7:30 - 9:30 PM"
                                items={menu.dinner || 'No menu set yet'}
                                status={hour >= 22 ? 'done' : hour >= 19 ? 'active' : 'upcoming'}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'payments' && (
                    <div className="animate-fadeIn">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Fee Ledger</h2>
                        </div>
                        <div className="card overflow-hidden">
                            {payments.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p className="font-medium">No fee records found</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {payments.map(p => (
                                        <div key={p.id} className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                    <DollarSign className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{new Date(p.month).toLocaleDateString('default', { month: 'long', year: 'numeric' })}</p>
                                                    <p className="text-xs text-gray-400">Status updated {new Date(p.markedAt || p.month).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {p.status === 'paid' ? (
                                                    <span className="badge badge-success"><CheckCircle2 className="w-3 h-3" /> Paid ✓</span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Pending</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {showScanner && (
                <QRScanner 
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                />
            )}

            <nav className="mobile-nav safe-bottom">
                <button
                    onClick={() => setActiveTab('home')}
                    className={`mobile-nav-item ${activeTab === 'home' ? 'active' : ''}`}
                >
                    <Home className="w-5 h-5" />
                    <span className="text-xs">Home</span>
                </button>
                <button
                    onClick={() => setShowScanner(true)}
                    className="flex flex-col items-center -mt-6"
                >
                    <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg text-white">
                        <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-gray-500 mt-1">Scan QR</span>
                </button>
                <button
                    onClick={() => setActiveTab('payments')}
                    className={`mobile-nav-item ${activeTab === 'payments' ? 'active' : ''}`}
                >
                    <History className="w-5 h-5" />
                    <span className="text-xs">Fees</span>
                </button>
            </nav>
        </div>
    );
}

function MealCard({ icon, title, time, items, status }: any) {
    const statusColors = {
        active: 'border-red-200 bg-red-50/50',
        done: 'opacity-60 grayscale-[0.5]',
        upcoming: 'border-gray-100 bg-white'
    };

    return (
        <div className={`card p-4 flex items-start gap-4 transition-all ${statusColors[status as keyof typeof statusColors]}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                status === 'active' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-900">{title}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{time}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                    {items}
                </p>
                {status === 'active' && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-red-600 uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        Serving Now
                    </div>
                )}
            </div>
        </div>
    );
}
