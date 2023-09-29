require('dotenv').config();

module.exports = {
    "type": "mysql",
    "host": process.env.DB_HOST || "localhost",
    "port": process.env.DB_PORT || 3306,
    "username": process.env.DB_USER || "root",
    "password": process.env.DB_PASS || "",
    "database": process.env.DB_NAME || "test",
    "synchronize": false,
    "logging": false,
    "entities": ["api/models/**/*.ts"],
    "migrations": ["api/migrations/**/*.ts"],
    "subscribers": ["api/subscriber/**/*.ts"],
    "cli": {
        "entitiesDir": "api/models",
        "migrationsDir": "api/migrations",
        "subscribersDir": "api/subscribers"
    }
}
