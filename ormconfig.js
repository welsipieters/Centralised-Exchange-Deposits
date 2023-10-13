require('dotenv').config();

module.exports = {
    "type": "mysql",
    "host": process.env.DB_HOST || "localhost",
    "port": process.env.DB_PORT || 3306,
    "username": process.env.DB_USER || "root",
    "password": process.env.DB_PASS || "",
    "database": process.env.DB_NAME || "test",
    "charset": "utf8mb4",
    "synchronize": false,
    "logging": false,
    "entities": ["shared/models/**/*.ts"],
    "migrations": ["shared/migrations/**/*.ts"],
    "subscribers": ["shared/subscribers/**/*.ts"],
    "cli": {
        "entitiesDir": "shared/models",
        "migrationsDir": "shared/migrations",
        "subscribersDir": "shared/subscribers"
    }
}
