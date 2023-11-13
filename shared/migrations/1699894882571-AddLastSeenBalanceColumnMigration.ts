import {MigrationInterface, QueryRunner, TableColumn} from "typeorm"

export class AddLastSeenBalanceColumnMigration1699894882571 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const newColumn = new TableColumn({
            name: 'last_seen_balance',
            default: '0',
            type: 'varchar', // assuming block numbers will be stored as big integers
            isNullable: true, // assuming you want to allow null values
        });

        await queryRunner.addColumn('deposit_address', newColumn);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('deposit_address', 'last_seen_balance');
    }


}
