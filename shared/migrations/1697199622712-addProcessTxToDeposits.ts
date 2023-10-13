import {MigrationInterface, QueryRunner, TableColumn} from "typeorm"

export class AddProcessTxToDeposits1697199622712 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('deposits', new TableColumn({
            name: 'process_tx',
            type: 'varchar',
            isNullable: true,  // Assuming the new column can be nullable
            length: '255'      // Assuming varchar length of 255, adjust if needed
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('deposits', 'processTx');
    }

}
