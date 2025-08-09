import dotenv from 'dotenv';
dotenv.config();
import {Pool} from 'pg';

const pool = new Pool({
    user:process.env.DB_USER || "postgres",
    password:process.env.DB_PASSWORD || "1234",
    host:process.env.DB_HOST || "localhost",
    port:process.env.DB_PORT || 5432,
    database:process.env.DB_NAME || "resturant_managment"
})

export default pool;
