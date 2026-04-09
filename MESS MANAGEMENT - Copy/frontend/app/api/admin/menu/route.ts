import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

        const res = await query(`
            SELECT mi.* 
            FROM menu_items mi
            JOIN menu_days md ON md.id = mi.menu_day_id
            WHERE md.menu_date = $1
        `, [date]);

        return NextResponse.json({ items: res.rows });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { date, breakfast, lunch, dinner } = await req.json();

        // 1. Ensure menu day exists
        let dayRes = await query("SELECT id FROM menu_days WHERE menu_date = $1", [date]);
        let dayId;

        if (dayRes.rowCount === 0) {
            const insertDay = await query("INSERT INTO menu_days (menu_date) VALUES ($1) RETURNING id", [date]);
            dayId = insertDay.rows[0].id;
        } else {
            dayId = dayRes.rows[0].id;
        }

        // 2. Clear old items for this day
        await query("DELETE FROM menu_items WHERE menu_day_id = $1", [dayId]);

        // 3. Insert new items
        const meals = [
            { name: 'breakfast', items: breakfast },
            { name: 'lunch', items: lunch },
            { name: 'dinner', items: dinner }
        ];

        for (const m of meals) {
            if (m.items) {
                // Split multi-line or comma-separated items
                const itemArray = m.items.split(/[,|\n]/).map((i: string) => i.trim()).filter((i: string) => i);
                for (const itemName of itemArray) {
                    await query(
                        "INSERT INTO menu_items (menu_day_id, meal, item_name) VALUES ($1, $2, $3)",
                        [dayId, m.name, itemName]
                    );
                }
            }
        }

        return NextResponse.json({ status: 'success' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
