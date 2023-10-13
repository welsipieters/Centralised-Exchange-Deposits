import {MigrationInterface, QueryRunner, TableColumn} from "typeorm"

export class AddProcessedToDeposits1697145981570 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('deposits', new TableColumn({
            name: 'processed',
            type: 'boolean',
            default: false
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('deposits', 'processed');
    }

}
