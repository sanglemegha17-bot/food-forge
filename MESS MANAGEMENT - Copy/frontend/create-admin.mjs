import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: "postgresql://neondb_owner:npg_vdnwTcDS09YO@ep-raspy-credit-anz1q9jm-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require" });

async function createAdmin() {
    console.log("Creating admin user...");
    const login = 'admin';
    const password = 'admin';
    const name = 'System Administrator';
    
    try {
        const hash = await bcrypt.hash(password, 10);
        await pool.query(
            `INSERT INTO users (email, password_hash, full_name, role) 
             VALUES ($1, $2, $3, 'admin')
             ON CONFLICT (email) DO UPDATE SET role = 'admin'`,
            [login, hash, name]
        );
        console.log("Admin user created/updated successfully!");
    } catch (e) {
        console.error("Error creating admin:", e);
    } finally {
        await pool.end();
    }
}

createAdmin();
