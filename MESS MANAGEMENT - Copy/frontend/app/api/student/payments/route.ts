import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Fetch historically
        const sql = `
            SELECT id, month, amount_paid, status, marked_at 
            FROM payments 
            WHERE user_id = $1 
            ORDER BY month DESC
        `;
        
        const result = await query(sql, [userId]);

        return NextResponse.json({
            payments: result.rows.map(r => ({
                id: r.id,
                month: r.month,
                amountPaid: r.amount_paid,
                status: r.status,
                markedAt: r.marked_at
            }))
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
