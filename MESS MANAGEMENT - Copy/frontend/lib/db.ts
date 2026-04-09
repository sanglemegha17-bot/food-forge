import { Pool } from '@neondatabase/serverless';

// Create a singleton pool to maintain connections effectively
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function query(text: string, params?: any[]) {
    return pool.query(text, params);
}

export default pool;
