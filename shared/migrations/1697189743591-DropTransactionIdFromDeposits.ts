import {MigrationInterface, QueryRunner, TableColumn} from "typeorm"

export class DropTransactionIdFromDeposits1697189743591 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists before trying to drop
        const migrationsTable = await queryRunner.getTable('deposits');
        const transactionIdColumn = migrationsTable?.findColumnByName('transaction_id');
        if (transactionIdColumn) {
            await queryRunner.dropColumn('deposits', 'transaction_id');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('deposits', new TableColumn({
            name: 'transaction_id',
            type: 'varchar', // or whatever type it was
            isNullable: true, // adjust this as per your previous schema
        }));
    }


}
