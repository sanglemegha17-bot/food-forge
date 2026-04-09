import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PATCH(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        await query('UPDATE meal_sessions SET is_active = false WHERE id = $1', [params.id]);
        return NextResponse.json({ status: 'stopped' });
    } catch (err: any) {
        console.error('[Admin Sessions PATCH]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
