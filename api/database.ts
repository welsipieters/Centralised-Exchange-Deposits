
import { createConnection } from 'typeorm';

export const initializeDatabase = async () => {
    try {
        await createConnection(); // Uses ormconfig.json by default
        console.log('Database connection established');
    } catch (error) {
        console.error('Error connecting to the database', error);
        process.exit(1); // Exit the application on database connection error
    }
};
