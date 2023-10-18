import { MigrationInterface, QueryRunner } from "typeorm"

export class SetUtf8mb4Charset1697639242988 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER DATABASE ${process.env.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert the changes if necessary
        await queryRunner.query(`ALTER DATABASE ${process.env.DB_NAME} CHARACTER SET utf8 COLLATE utf8_unicode_ci;`);
    }

}
