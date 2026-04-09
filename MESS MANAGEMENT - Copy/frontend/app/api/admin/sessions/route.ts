import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { meal } = await req.json();

        if (!['breakfast', 'lunch', 'dinner'].includes(meal)) {
            return NextResponse.json({ error: 'Invalid meal type' }, { status: 400 });
        }

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min from now

        const result = await query(
            'INSERT INTO meal_sessions (meal, expires_at, is_active, session_date) VALUES ($1, $2, true, CURRENT_DATE) RETURNING *',
            [meal, expiresAt]
        );

        return NextResponse.json({ session: result.rows[0] });
    } catch (err: any) {
        console.error('[Admin Sessions POST]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
