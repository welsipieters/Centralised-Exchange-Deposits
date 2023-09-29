import {MigrationInterface, QueryRunner, TableColumn} from "typeorm"

export class AddLastSeenAtBlockColumnMigration1695962412416 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const newColumn = new TableColumn({
            name: 'last_seen_at_block',
            type: 'bigint', // assuming block numbers will be stored as big integers
            isNullable: true, // assuming you want to allow null values
        });

        await queryRunner.addColumn('deposit_address', newColumn);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('deposit_address', 'last_seen_at_block');
    }

}
