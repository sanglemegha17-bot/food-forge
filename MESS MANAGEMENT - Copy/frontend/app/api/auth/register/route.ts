import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { email, password, fullName } = await req.json();

        if (!email || !password || !fullName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if user already exists
        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rowCount && existing.rowCount > 0) {
            return NextResponse.json({ error: 'User already exists with this email' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const result = await query(
            'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id',
            [email, hashedPassword, fullName, 'student']
        );

        return NextResponse.json({ status: 'ok', userId: result.rows[0].id });
    } catch (err: any) {
        console.error('[Register POST]', err);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
