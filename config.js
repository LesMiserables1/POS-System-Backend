import dotenv from 'dotenv';

dotenv.config();

export default {
    port : process.env.APP_PORT,
    db_name : process.env.DB_NAME,
    db_password : process.env.DB_PASSWORD,
    db_username : process.env.DB_USERNAME,
    secret_key : process.env.SECRET_KEY
}