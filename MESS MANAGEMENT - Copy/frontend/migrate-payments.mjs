import { Pool } from '@neondatabase/serverless';

async function main() {
    console.log("Connecting to Neon...");
    const pool = new Pool({ connectionString: "postgresql://neondb_owner:npg_vdnwTcDS09YO@ep-raspy-credit-anz1q9jm-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require" });
    
    const query = `
    CREATE TABLE IF NOT EXISTS payments (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        month       DATE NOT NULL,
        amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
        status      TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'overdue')) DEFAULT 'pending',
        marked_by   UUID REFERENCES users(id) ON DELETE SET NULL,
        marked_at   TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (user_id, month)
    );
    `;

    console.log("Executing payments migration...");
    try {
        await pool.query(query);
        console.log("Payments table initialized successfully!");
    } catch (e) {
        console.error("Error executing schema:", e);
    } finally {
        await pool.end();
    }
}
main();
