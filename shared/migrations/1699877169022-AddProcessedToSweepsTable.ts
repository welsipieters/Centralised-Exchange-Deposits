import {MigrationInterface, QueryRunner, TableColumn} from "typeorm"

export class AddProcessedToSweepsTable1699877169022 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Adding 'processed' column
        await queryRunner.addColumn('sweeps', new TableColumn({
            name: 'processed',
            type: 'boolean',
            default: false, // Assuming unprocessed by default
        }));

        // Adding 'sweepHash' column
        await queryRunner.addColumn('sweeps', new TableColumn({
            name: 'sweepHash',
            type: 'varchar', // or another appropriate type based on your needs
            isNullable: true, // Assuming the hash can be nullable, change if needed
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Dropping 'processed' column
        await queryRunner.dropColumn('sweeps', 'processed');

        // Dropping 'sweepHash' column
        await queryRunner.dropColumn('sweeps', 'sweepHash');
    }
}
