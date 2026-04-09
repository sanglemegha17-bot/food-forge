import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        // Fetch active session
        const sessionRes = await query(`
            SELECT * FROM meal_sessions 
            WHERE is_active = true AND session_date = CURRENT_DATE 
            ORDER BY created_at DESC LIMIT 1
        `);
        const activeSession = sessionRes.rowCount ? sessionRes.rows[0] : null;

        // Fetch users
        const usersRes = await query("SELECT * FROM users WHERE role = 'student'");
        const users = usersRes.rows;

        // Fetch session scans if active
        let sessionScans: any[] = [];
        if (activeSession) {
            const scansRes = await query(`
                SELECT ms.scan_time, u.full_name as profile_name 
                FROM meal_scans ms
                JOIN users u ON u.id = ms.user_id
                WHERE ms.session_id = $1
                ORDER BY ms.scan_time DESC
            `, [activeSession.id]);
            sessionScans = scansRes.rows.map(r => ({
                scan_time: r.scan_time,
                profiles: { full_name: r.profile_name }
            }));
        }

        // Fetch today's scans for stats
        const todayScansRes = await query("SELECT * FROM meal_scans WHERE scan_date = CURRENT_DATE");
        const todayScans = todayScansRes.rows;

        return NextResponse.json({
            activeSession,
            users,
            sessionScans,
            todayScans
        });
    } catch (err: any) {
        console.error('[Admin Dashboard GET]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
