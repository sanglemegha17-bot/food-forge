import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { user_id, meal, scan_date } = await req.json();

        if (!user_id || !meal) {
            return NextResponse.json({ error: 'user_id and meal are required' }, { status: 400 });
        }

        const dateToUse = scan_date || new Date().toISOString().split('T')[0];

        // Check if user has already scanned using SELECT
        const existing = await query('SELECT id FROM meal_scans WHERE user_id = $1 AND meal = $2 AND scan_date = $3', [user_id, meal, dateToUse]);
        if (existing.rowCount && existing.rowCount > 0) {
            return NextResponse.json({ error: 'duplicate', code: '23505' }, { status: 409 });
        }

        await query(
            'INSERT INTO meal_scans (user_id, meal, scan_date) VALUES ($1, $2, $3)',
            [user_id, meal, dateToUse]
        );

        return NextResponse.json({ status: 'scanned' });
    } catch (err: any) {
        console.error('[Admin Scan POST]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
