
import { createConnection } from 'typeorm';

export const initializeDatabase = async () => {
    try {
        const connection = await createConnection();
        const migration = await connection.runMigrations();
        console.log('Database connection established');
        console.log('Migrations run', migration)
    } catch (error) {
        console.error('Error connecting to the database', error);
        process.exit(1);
    }
};
