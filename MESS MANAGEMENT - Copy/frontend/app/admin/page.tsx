'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { QRCodeSVG } from 'qrcode.react';
import {
    Users, ChefHat, AlertCircle, LogOut,
    QrCode, UserPlus, CheckCircle2, XCircle,
    Loader2, RefreshCw, Menu, X, Home,
    Coffee, UtensilsCrossed, Moon, Play, Square,
    Timer, Wifi, DollarSign, Utensils, Trash2, Download
} from 'lucide-react';

// Dynamic import for QR Scanner (client-side only)
const QRScanner = dynamic(() => import('@/components/QRScanner'), { ssr: false });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Hardcoded admin credentials
const ADMIN_USERNAME = 'admin1';
const ADMIN_PASSWORD = 'admin1';

interface Student {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    created_at: string;
}

interface Attendance {
    id: string;
    user_id: string;
    meal: string;
    scan_time: string;
    profiles?: any;
}

export default function AdminDashboard() {
    // Auth state
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    // Data state
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(false);
    const [payments, setPayments] = useState<any[]>([]);
    const [menuItems, setMenuItems] = useState({ breakfast: '', lunch: '', dinner: '' });
    const [savingMenu, setSavingMenu] = useState(false);

    // UI state
    const [showScanner, setShowScanner] = useState(false);
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'attendance' | 'session' | 'payments' | 'menu'>('dashboard');
    const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);

    // Session QR state
    const [activeSession, setActiveSession] = useState<any>(null);
    const [sessionCountdown, setSessionCountdown] = useState('');
    const [sessionScans, setSessionScans] = useState<any[]>([]);
    const [creatingSession, setCreatingSession] = useState(false);

    // New student form
    const [newStudent, setNewStudent] = useState({ email: '', password: '', fullName: '' });
    const [addingStudent, setAddingStudent] = useState(false);

    // Handle admin login
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            setIsLoggedIn(true);
            setLoginError('');
            localStorage.setItem('adminLoggedIn', 'true');
        } else {
            setLoginError('Invalid credentials. Use admin1/admin1');
        }
    };

    // Check if already logged in
    useEffect(() => {
        const loggedIn = localStorage.getItem('adminLoggedIn');
        if (loggedIn === 'true') {
            setIsLoggedIn(true);
        }
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/dashboard');
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            
            setStudents(json.users || []);
            setAttendance(json.todayScans || []);
            if (json.activeSession) {
                setActiveSession(json.activeSession);
                setSessionScans(json.sessionScans || []);
            }
        } catch (err) {
            console.error('Data pull error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoggedIn) return;
        
        fetchDashboardData(); // Initial load
        const interval = setInterval(fetchDashboardData, 3000); // Poll every 3 seconds for active scans!

        return () => clearInterval(interval);
    }, [isLoggedIn]);

    const fetchPayments = async (month?: string) => {
        try {
            const res = await fetch(`/api/admin/payments${month ? `?month=${month}` : ''}`);
            const json = await res.json();
            if (res.ok) setPayments(json.students || []);
        } catch (e) {
            console.error('Failed to fetch payments', e);
        }
    };

    useEffect(() => {
        if (isLoggedIn && activeTab === 'payments') {
            fetchPayments();
        }
    }, [isLoggedIn, activeTab]);

    const fetchMenu = async () => {
        try {
            const res = await fetch('/api/admin/menu');
            const json = await res.json();
            if (res.ok) {
                const b = json.items.filter((i: any) => i.meal === 'breakfast').map((i: any) => i.item_name).join(', ');
                const l = json.items.filter((i: any) => i.meal === 'lunch').map((i: any) => i.item_name).join(', ');
                const d = json.items.filter((i: any) => i.meal === 'dinner').map((i: any) => i.item_name).join(', ');
                setMenuItems({ breakfast: b, lunch: l, dinner: d });
            }
        } catch (e) {
            console.error('Menu fetch failed', e);
        }
    };

    useEffect(() => {
        if (isLoggedIn && activeTab === 'menu') {
            fetchMenu();
        }
    }, [isLoggedIn, activeTab]);

    const handleSaveMenu = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingMenu(true);
        try {
            const res = await fetch('/api/admin/menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: new Date().toISOString().split('T')[0],
                    ...menuItems
                })
            });
            if (res.ok) {
                setScanResult({ success: true, message: 'Menu updated successfully!' });
                setTimeout(() => setScanResult(null), 3000);
            }
        } catch (e) {
            console.error('Menu save failed', e);
        } finally {
            setSavingMenu(false);
        }
    };

    const handleDeleteStudent = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this student and all their records?')) return;
        try {
            const res = await fetch('/api/admin/users/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            if (res.ok) {
                setStudents(prev => prev.filter(s => s.id !== userId));
            }
        } catch (e) {
            console.error('Delete failed', e);
        }
    };

    const exportToCSV = () => {
        const headers = ['Name', 'Meal', 'Time'];
        const rows = attendance.map(a => [
            (a.profiles as any)?.full_name || 'Unknown',
            a.meal,
            new Date(a.scan_time).toLocaleTimeString()
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `attendance_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleTogglePayment = async (userId: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
            const res = await fetch('/api/admin/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, month: new Date().toISOString().substring(0, 7) + '-01', status: newStatus })
            });
            if (res.ok) {
                setPayments(prev => prev.map(p => p.id === userId ? { ...p, status: newStatus } : p));
            }
        } catch (e) {
            console.error('Payment toggle failed', e);
        }
    };

    // Handle QR scan (admin scans student's personal QR code — old flow)
    const handleQRScan = async (data: string) => {
        try {
            const parsed = JSON.parse(data);
            const userId = parsed.uid;

            if (!userId) {
                setScanResult({ success: false, message: 'Invalid QR code format' });
                return;
            }

            // Determine current meal based on time
            const hour = new Date().getHours();
            let meal = 'dinner';
            if (hour >= 6 && hour < 10) meal = 'breakfast';
            else if (hour >= 11 && hour < 15) meal = 'lunch';

            // Insert attendance record via API route (uses service role to bypass RLS)
            const res = await fetch('/api/admin/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    meal,
                    scan_date: new Date().toISOString().split('T')[0],
                }),
            });
            const json = await res.json();

            if (!res.ok) {
                if (res.status === 409 || json.code === '23505') {
                    setScanResult({ success: false, message: `Already marked for ${meal}!` });
                } else {
                    throw new Error(json.error);
                }
            } else {
                setScanResult({ success: true, message: `${meal.charAt(0).toUpperCase() + meal.slice(1)} attendance marked!` });
            }
        } catch (err: any) {
            console.error('Scan error:', err);
            setScanResult({ success: false, message: err.message || 'Failed to process QR code' });
        }

        setShowScanner(false);
        setTimeout(() => setScanResult(null), 3000);
    };

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddingStudent(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newStudent.email, password: newStudent.password, fullName: newStudent.fullName })
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to add student');

            setShowAddStudent(false);
            setNewStudent({ email: '', password: '', fullName: '' });
        } catch (err: any) {
            alert(err.message);
        } finally {
            setAddingStudent(false);
        }
    };

    // Logout
    const handleLogout = () => {
        localStorage.removeItem('adminLoggedIn');
        setIsLoggedIn(false);
    };

    // ── Session QR ──────────────────────────────────────────
    const handleStartSession = async (meal: 'breakfast' | 'lunch' | 'dinner') => {
        setCreatingSession(true);
        try {
            const res = await fetch('/api/admin/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ meal }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to create session');
            setActiveSession(json.session);
            setSessionScans([]);
        } catch (err: any) {
            alert('Could not create session: ' + err.message);
        } finally {
            setCreatingSession(false);
        }
    };

    const handleStopSession = async () => {
        if (!activeSession) return;
        await fetch(`/api/admin/sessions/${activeSession.id}`, { method: 'PATCH' });
        setActiveSession(null);
        setSessionCountdown('');
        setSessionScans([]);
    };

    // Countdown ticker
    useEffect(() => {
        if (!activeSession) return;
        const tick = () => {
            const diff = new Date(activeSession.expires_at).getTime() - Date.now();
            if (diff <= 0) {
                setSessionCountdown('Expired');
            } else {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setSessionCountdown(`${m}:${s.toString().padStart(2, '0')}`);
            }
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [activeSession]);

    // Real-time replacements are handled via polling in fetchDashboardData

    // Get current meal stats
    const getMealStats = () => {
        const breakfast = attendance.filter(a => a.meal === 'breakfast').length;
        const lunch = attendance.filter(a => a.meal === 'lunch').length;
        const dinner = attendance.filter(a => a.meal === 'dinner').length;
        return { breakfast, lunch, dinner, total: breakfast + lunch + dinner };
    };

    const stats = getMealStats();

    // Login Screen
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-scaleIn">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <ChefHat className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
                        <p className="text-gray-500 mt-2">The Food Forge</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input-field"
                                placeholder="Enter username"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                placeholder="Enter password"
                                required
                            />
                        </div>

                        {loginError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {loginError}
                            </div>
                        )}

                        <button type="submit" className="w-full btn-primary py-3.5">
                            Sign In
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Admin Dashboard
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-40 px-4 py-3 flex items-center justify-between">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 hover:bg-gray-100 rounded-xl"
                >
                    <Menu className="w-6 h-6 text-gray-700" />
                </button>
                <span className="font-bold text-gray-900">Food<span className="text-red-600">Forge</span></span>
                <button
                    onClick={() => setShowScanner(true)}
                    className="p-2 bg-red-500 text-white rounded-xl"
                >
                    <QrCode className="w-5 h-5" />
                </button>
            </header>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-50"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 w-72 h-full bg-white border-r border-gray-100 z-50
                transform transition-transform duration-300
                lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-8">
                        <Link href="/" className="font-bold text-xl text-gray-900">
                            The Food <span className="text-red-600">Forge</span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 -mt-6 mb-6">Admin Portal</p>

                    <nav className="space-y-1">
                        <NavItem
                            active={activeTab === 'dashboard'}
                            onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
                            icon={<Home className="w-5 h-5" />}
                        >
                            Dashboard
                        </NavItem>
                        <NavItem
                            active={activeTab === 'students'}
                            onClick={() => { setActiveTab('students'); setSidebarOpen(false); }}
                            icon={<Users className="w-5 h-5" />}
                        >
                            Students ({students.length})
                        </NavItem>
                        <NavItem
                            active={activeTab === 'attendance'}
                            onClick={() => { setActiveTab('attendance'); setSidebarOpen(false); }}
                            icon={<CheckCircle2 className="w-5 h-5" />}
                        >
                            Attendance ({stats.total})
                        </NavItem>
                        <NavItem
                            active={activeTab === 'payments'}
                            onClick={() => { setActiveTab('payments'); setSidebarOpen(false); }}
                            icon={<DollarSign className="w-5 h-5" />}
                        >
                            Payments
                        </NavItem>
                        <NavItem
                            active={activeTab === 'session'}
                            onClick={() => { setActiveTab('session'); setSidebarOpen(false); }}
                            icon={<QrCode className="w-5 h-5" />}
                        >
                            Session QR
                            {activeSession && (
                                <span className="ml-auto flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    <Wifi className="w-3 h-3" /> Live
                                </span>
                            )}
                        </NavItem>
                        <NavItem
                            active={activeTab === 'menu'}
                            onClick={() => { setActiveTab('menu'); setSidebarOpen(false); }}
                            icon={<Utensils className="w-5 h-5" />}
                        >
                            Mess Menu
                        </NavItem>
                    </nav>
                </div>

                {/* Admin Footer */}
                <div className="absolute bottom-6 left-6 right-6">
                    <div className="p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-700 font-semibold">A</div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">Admin</p>
                                <p className="text-xs text-gray-500">Administrator</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-8 pb-24 lg:pb-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {activeTab === 'dashboard' && 'Dashboard'}
                            {activeTab === 'students' && 'Students'}
                            {activeTab === 'attendance' && "Today's Attendance"}
                            {activeTab === 'session' && 'Session QR'}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-3">
                        <button
                            onClick={fetchDashboardData}
                            className="btn-icon"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => setShowScanner(true)}
                            className="btn-primary hidden lg:flex items-center gap-2"
                        >
                            <QrCode className="w-5 h-5" />
                            Scan QR
                        </button>
                    </div>
                </div>

                {/* Scan Result Toast */}
                {scanResult && (
                    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3 animate-slideUp ${scanResult.success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                        {scanResult.success ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                        <span className="font-medium">{scanResult.message}</span>
                    </div>
                )}

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
                            <StatCard label="Total Students" value={students.length.toString()} sublabel="Registered" />
                            <StatCard label="Breakfast" value={stats.breakfast.toString()} sublabel="Today" />
                            <StatCard label="Lunch" value={stats.lunch.toString()} sublabel="Today" />
                            <StatCard label="Dinner" value={stats.dinner.toString()} sublabel="Today" accent />
                        </div>

                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Recent Scans */}
                            <div className="lg:col-span-2 card p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="font-semibold text-gray-900">Recent Scans</h2>
                                    <button
                                        onClick={() => setActiveTab('attendance')}
                                        className="text-sm text-red-600 hover:underline"
                                    >
                                        View all
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {attendance.slice(0, 5).map((scan, i) => (
                                        <div key={scan.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                                                    {((scan.profiles as any)?.full_name || 'U').charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{(scan.profiles as any)?.full_name || 'Unknown'}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(scan.scan_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`badge ${scan.meal === 'breakfast' ? 'badge-info' :
                                                scan.meal === 'lunch' ? 'badge-success' : 'badge-warning'
                                                }`}>
                                                {scan.meal}
                                            </span>
                                        </div>
                                    ))}
                                    {attendance.length === 0 && (
                                        <div className="text-center py-8 text-gray-400">
                                            <QrCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p>No scans yet today</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="space-y-6">
                                <div className="card-accent p-6">
                                    <h3 className="font-semibold mb-2">Quick Scan</h3>
                                    <p className="text-sm text-red-100 mb-4">Scan student QR code to mark attendance</p>
                                    <button
                                        onClick={() => setShowScanner(true)}
                                        className="w-full py-3 bg-white text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <QrCode className="w-5 h-5" />
                                        Open Scanner
                                    </button>
                                </div>

                                <div className="card p-6">
                                    <h3 className="font-semibold text-gray-900 mb-4">Add Student</h3>
                                    <p className="text-sm text-gray-500 mb-4">Register a new student account</p>
                                    <button
                                        onClick={() => setShowAddStudent(true)}
                                        className="w-full btn-secondary flex items-center justify-center gap-2"
                                    >
                                        <UserPlus className="w-5 h-5" />
                                        Add Student
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Students Tab */}
                {activeTab === 'students' && (
                    <div className="card overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900">Registered Students</h2>
                            <button
                                onClick={() => setShowAddStudent(true)}
                                className="btn-primary text-sm py-2 flex items-center gap-2"
                            >
                                <UserPlus className="w-4 h-4" />
                                Add Student
                            </button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {students.map((student) => (
                                <div key={student.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white font-semibold">
                                            {student.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{student.full_name}</p>
                                            <p className="text-sm text-gray-500">
                                                Joined {new Date(student.created_at).toLocaleDateString('en-IN')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="badge badge-success">Active</span>
                                        <button 
                                            onClick={() => handleDeleteStudent(student.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {students.length === 0 && (
                                <div className="p-12 text-center text-gray-400">
                                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium mb-2">No students yet</p>
                                    <p className="text-sm">Students will appear here after registration</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Payments Tab */}
                {activeTab === 'payments' && (
                    <div className="card overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900">Current Month Fee Status</h2>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {payments.map((p) => (
                                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                                            {p.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{p.fullName}</p>
                                            <p className="text-xs text-gray-500">{p.loginId}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <button 
                                            onClick={() => handleTogglePayment(p.id, p.status)}
                                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${p.status === 'paid' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                        >
                                            {p.status === 'paid' ? 'Paid ✓' : 'Mark as Paid'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Attendance Tab */}
                {activeTab === 'attendance' && (
                    <div className="card overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold text-gray-900">Today's Attendance Log</h2>
                                <div className="flex gap-4 mt-2">
                                    <span className="badge badge-info">Breakfast: {stats.breakfast}</span>
                                    <span className="badge badge-success">Lunch: {stats.lunch}</span>
                                    <span className="badge badge-warning">Dinner: {stats.dinner}</span>
                                </div>
                            </div>
                            <button onClick={exportToCSV} className="btn-secondary flex items-center gap-2">
                                <Download className="w-4 h-4" /> Export CSV
                            </button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {attendance.map((scan) => (
                                <div key={scan.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                                            {((scan.profiles as any)?.full_name || 'U').charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{(scan.profiles as any)?.full_name || 'Unknown'}</p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(scan.scan_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`badge ${scan.meal === 'breakfast' ? 'badge-info' :
                                        scan.meal === 'lunch' ? 'badge-success' : 'badge-warning'
                                        }`}>
                                        {scan.meal}
                                    </span>
                                </div>
                            ))}
                            {attendance.length === 0 && (
                                <div className="p-12 text-center text-gray-400">
                                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium mb-2">No attendance recorded</p>
                                    <p className="text-sm">Scan student QR codes to mark attendance</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Session QR Tab ── */}
                {activeTab === 'session' && (
                    <div className="space-y-6">
                        {!activeSession ? (
                            /* No active session — choose meal */
                            <div className="card p-8">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <QrCode className="w-8 h-8 text-red-500" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">Start a Meal Session</h2>
                                    <p className="text-gray-500 text-sm mt-2">
                                        A QR code will appear on screen. Students scan it to self-mark attendance.
                                        Sessions expire in <span className="font-semibold">15 minutes</span>.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {[
                                        { meal: 'breakfast' as const, label: 'Breakfast', time: '7:30–9:30 AM', icon: <Coffee className="w-6 h-6" />, color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
                                        { meal: 'lunch'     as const, label: 'Lunch',     time: '12:30–2:30 PM', icon: <UtensilsCrossed className="w-6 h-6" />, color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' },
                                        { meal: 'dinner'    as const, label: 'Dinner',    time: '7:30–9:30 PM', icon: <Moon className="w-6 h-6" />, color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },
                                    ].map(({ meal, label, time, icon, color }) => (
                                        <button
                                            key={meal}
                                            disabled={creatingSession}
                                            onClick={() => handleStartSession(meal)}
                                            className={`flex flex-col items-center gap-3 p-6 border-2 rounded-2xl transition-all font-medium ${color} disabled:opacity-50`}
                                        >
                                            {creatingSession ? <Loader2 className="w-6 h-6 animate-spin" /> : icon}
                                            <div>
                                                <p className="font-semibold">{label}</p>
                                                <p className="text-xs opacity-70 mt-0.5">{time}</p>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs opacity-70">
                                                <Play className="w-3 h-3" /> Start Session
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Active session — show QR + live list */
                            <div className="grid lg:grid-cols-5 gap-6">
                                {/* QR Panel */}
                                <div className="lg:col-span-3 card p-8 text-center">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="text-left">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                <span className="text-sm font-semibold text-green-700 uppercase tracking-wide">Live Session</span>
                                            </div>
                                            <p className="text-gray-500 text-sm mt-1 capitalize">Meal: <span className="font-semibold text-gray-900">{activeSession.meal}</span></p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full">
                                                <Timer className="w-4 h-4" />
                                                <span className="font-mono font-bold text-sm">{sessionCountdown}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="inline-block p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl border-2 border-gray-200 mb-6">
                                        <QRCodeSVG
                                            value={`${APP_URL}/checkin?session=${activeSession.id}`}
                                            size={220}
                                            bgColor="transparent"
                                            fgColor="#111827"
                                            level="M"
                                        />
                                    </div>

                                    <p className="text-gray-500 text-sm mb-1">Students scan this to mark their attendance</p>
                                    <p className="font-mono text-xs text-gray-400 break-all mb-6">
                                        {APP_URL}/checkin?session={activeSession.id}
                                    </p>

                                    <button
                                        onClick={handleStopSession}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl font-medium transition-colors"
                                    >
                                        <Square className="w-4 h-4" />
                                        Stop Session
                                    </button>
                                </div>

                                {/* Live Check-in List */}
                                <div className="lg:col-span-2 card overflow-hidden">
                                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-900">Checked In</h3>
                                        <span className="badge badge-success">{sessionScans.length} students</span>
                                    </div>
                                    <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                                        {sessionScans.length === 0 ? (
                                            <div className="p-8 text-center text-gray-400">
                                                <Wifi className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                                <p className="text-sm">Waiting for students to scan…</p>
                                            </div>
                                        ) : (
                                            sessionScans.map((scan: any) => (
                                                <div key={scan.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                                                    <div className="w-9 h-9 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                                        {(scan.profiles?.full_name || 'S').charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 text-sm truncate">{scan.profiles?.full_name || 'Student'}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {new Date(scan.scan_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                        </p>
                                                    </div>
                                                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {/* Menu Management Tab */}
                {activeTab === 'menu' && (
                    <div className="max-w-3xl card p-8">
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-gray-900">Daily Menu Setup</h2>
                            <p className="text-gray-500 text-sm mt-1">Set the mess menu for today. Students will see this live on their app.</p>
                        </div>

                        <form onSubmit={handleSaveMenu} className="space-y-6">
                            <div className="grid gap-6">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Coffee className="w-4 h-4" /> Breakfast
                                    </label>
                                    <textarea 
                                        value={menuItems.breakfast}
                                        onChange={e => setMenuItems({...menuItems, breakfast: e.target.value})}
                                        className="input-field h-24 pt-3" 
                                        placeholder="E.g. Idli, Sambar, Chutney, Coffee" 
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <UtensilsCrossed className="w-4 h-4" /> Lunch
                                    </label>
                                    <textarea 
                                        value={menuItems.lunch}
                                        onChange={e => setMenuItems({...menuItems, lunch: e.target.value})}
                                        className="input-field h-24 pt-3" 
                                        placeholder="E.g. Rice, Dal, Sabzi, Curd, Salad" 
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Moon className="w-4 h-4" /> Dinner
                                    </label>
                                    <textarea 
                                        value={menuItems.dinner}
                                        onChange={e => setMenuItems({...menuItems, dinner: e.target.value})}
                                        className="input-field h-24 pt-3" 
                                        placeholder="E.g. Roti, Paneer, Rice, Dessert" 
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button disabled={savingMenu} type="submit" className="btn-primary w-full py-4 flex items-center justify-center gap-2">
                                    {savingMenu ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Daily Menu'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="mobile-nav safe-bottom">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                >
                    <Home className="w-5 h-5" />
                    <span className="text-xs">Home</span>
                </button>
                <button
                    onClick={() => setShowScanner(true)}
                    className="p-4 bg-red-500 text-white rounded-2xl -mt-6 shadow-lg"
                >
                    <QrCode className="w-6 h-6" />
                </button>
                <button
                    onClick={() => setActiveTab('students')}
                    className={`mobile-nav-item ${activeTab === 'students' ? 'active' : ''}`}
                >
                    <Users className="w-5 h-5" />
                    <span className="text-xs">Students</span>
                </button>
            </nav>

            {/* QR Scanner Modal */}
            {showScanner && (
                <QRScanner
                    onScan={handleQRScan}
                    onClose={() => setShowScanner(false)}
                />
            )}

            {/* Add Student Modal */}
            {showAddStudent && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-scaleIn">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Add New Student</h3>

                        <form onSubmit={handleAddStudent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={newStudent.fullName}
                                    onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })}
                                    className="input-field"
                                    placeholder="Enter student name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={newStudent.email}
                                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                                    className="input-field"
                                    placeholder="student@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={newStudent.password}
                                    onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                                    className="input-field"
                                    placeholder="Min 6 characters"
                                    minLength={6}
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddStudent(false)}
                                    className="flex-1 btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addingStudent}
                                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                                >
                                    {addingStudent && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Add Student
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function NavItem({ children, active, onClick, icon }: { children: React.ReactNode; active?: boolean; onClick: () => void; icon: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${active
                ? 'bg-red-50 text-red-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
        >
            {icon}
            {children}
        </button>
    );
}

function StatCard({ label, value, sublabel, accent = false }: { label: string; value: string; sublabel: string; accent?: boolean }) {
    return (
        <div className={`card p-5 ${accent ? 'border-l-4 border-l-red-500' : ''}`}>
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sublabel}</p>
        </div>
    );
}
