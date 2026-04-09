import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json({ status: 'notloggedin', message: 'You must be logged in' }, { status: 401 });
        }

        const { sessionId } = await req.json();

        if (!sessionId) {
            return NextResponse.json({ status: 'invalid', message: 'No session provided.' }, { status: 400 });
        }

        const userId = (session.user as any).id;
        const studentName = session.user.name || 'Student';

        // 1. Validate Admin QR session
        const sessionRes = await query('SELECT * FROM meal_sessions WHERE id = $1', [sessionId]);
        if (sessionRes.rowCount === 0) {
            return NextResponse.json({ status: 'invalid', message: 'QR code not recognised.' }, { status: 404 });
        }

        const mealSession = sessionRes.rows[0];

        // 2. Check if expired
        if (!mealSession.is_active || new Date(mealSession.expires_at) < new Date()) {
            return NextResponse.json({ status: 'expired', message: `This ${mealSession.meal} session has expired.` }, { status: 400 });
        }

        // 3. Check if already scanned today (Neon raw PostgreSQL prevents duplication thanks to our UNIQUE constraint, but we can verify beforehand or catch the exception)
        const scanRes = await query('SELECT id FROM meal_scans WHERE user_id = $1 AND meal = $2 AND scan_date = CURRENT_DATE', [userId, mealSession.meal]);
        
        if (scanRes.rowCount && scanRes.rowCount > 0) {
             return NextResponse.json({ status: 'duplicate', message: `You've already been marked for ${mealSession.meal} today!`, studentName }, { status: 409 });
        }

        // 4. Mark attendance
        await query(
            'INSERT INTO meal_scans (user_id, session_id, meal, scan_date) VALUES ($1, $2, $3, CURRENT_DATE)',
            [userId, mealSession.id, mealSession.meal]
        );

        return NextResponse.json({ status: 'success', meal: mealSession.meal, studentName }, { status: 200 });

    } catch (err: any) {
        console.error('[Checkin API]', err);
        return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
    }
}
