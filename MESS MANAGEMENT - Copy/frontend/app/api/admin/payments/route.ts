import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(req.url);
        // By default target current month e.g., '2026-04-01'
        const rawMonth = url.searchParams.get('month');
        let targetMonthString = new Date().toISOString().substring(0, 7) + '-01';
        if (rawMonth) {
             targetMonthString = rawMonth + '-01'; // rawMonth expected as YYYY-MM
        }

        // Fetch all students and left join with payments for this specific month
        const sql = `
            SELECT 
                u.id as user_id, 
                u.full_name, 
                u.email,
                p.id as payment_id,
                p.status,
                p.marked_at
            FROM users u
            LEFT JOIN payments p ON p.user_id = u.id AND p.month = $1
            WHERE u.role = 'student'
            ORDER BY u.full_name ASC
        `;
        
        const result = await query(sql, [targetMonthString]);

        return NextResponse.json({
            month: targetMonthString,
            students: result.rows.map(r => ({
                id: r.user_id,
                fullName: r.full_name,
                loginId: r.email,
                paymentId: r.payment_id,
                status: r.status || 'pending',
            }))
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { userId, month, status } = body; 
        // month should be YYYY-MM-01 format

        if (!userId || !month || !status) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const adminId = (session.user as any).id;

        // Upsert payment status
        const sql = `
            INSERT INTO payments (user_id, month, status, marked_by, marked_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (user_id, month) 
            DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by, marked_at = NOW()
            RETURNING *;
        `;
        
        const result = await query(sql, [userId, month, status, adminId]);

        return NextResponse.json({ success: true, payment: result.rows[0] });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
