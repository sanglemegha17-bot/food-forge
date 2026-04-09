import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

async function main() {
    console.log("Connecting to Neon...");
    const pool = new Pool({ connectionString: "postgresql://neondb_owner:npg_vdnwTcDS09YO@ep-raspy-credit-anz1q9jm-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require" });
    
    console.log("Reading SQL file...");
    const schemaPath = path.join(process.cwd(), '..', 'NEON_DATABASE_SQL.sql');
    const content = fs.readFileSync(schemaPath, 'utf8');

    console.log("Executing query...");
    try {
        await pool.query(content);
        console.log("Database schema initialized successfully!");
    } catch (e) {
        console.error("Error executing schema:", e);
    } finally {
        await pool.end();
    }
}
main();
