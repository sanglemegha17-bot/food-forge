import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: "postgresql://neondb_owner:npg_vdnwTcDS09YO@ep-raspy-credit-anz1q9jm-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require" });

const students = [
    { login: 'IT001', name: 'Student IT001' },
    { login: 'IT002', name: 'Student IT002' },
    { login: 'IT003', name: 'Student IT003' },
    { login: 'IT004', name: 'Student IT004' },
    { login: 'IT005', name: 'Student IT005' },
    { login: 'IT006', name: 'Student IT006' },
    { login: 'IT007', name: 'Student IT007' },
    { login: 'IT008', name: 'Student IT008' },
    { login: 'IT009', name: 'Student IT009' },
    { login: 'IT010', name: 'Student IT010' },
];

async function seed() {
    console.log("Seeding students...");
    for (const s of students) {
        try {
            // Check if exists
            const res = await pool.query('SELECT id FROM users WHERE email = $1', [s.login]);
            if (res.rowCount > 0) {
                console.log(`Skipping ${s.login}, already exists.`);
                continue;
            }

            const hash = await bcrypt.hash(s.login, 10);
            await pool.query(
                `INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, 'student')`,
                [s.login, hash, s.name]
            );
            console.log(`Inserted ${s.login}`);
        } catch (e) {
            console.error(`Error inserting ${s.login}:`, e);
        }
    }
    console.log("Done seeding.");
    await pool.end();
}

seed();
