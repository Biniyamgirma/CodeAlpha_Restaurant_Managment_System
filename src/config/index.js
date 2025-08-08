import dotenv from 'dotenv';
dotenv.config();

export default {
    port:process.env.PORT_NUMBER || 3080,
    jwtSecret:process.env.JWT_SECRET || "hello",
    dburl:process.env.DB_CONFIG
}