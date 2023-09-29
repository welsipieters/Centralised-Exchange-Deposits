
import { createConnection } from 'typeorm';

export const initializeDatabase = async () => {
    try {
        const connection = await createConnection();
        await connection.runMigrations();
        console.log('Database connection established');
    } catch (error) {
        console.error('Error connecting to the database', error);
        process.exit(1);
    }
};
