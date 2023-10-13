import {MigrationInterface, QueryRunner, TableColumn} from "typeorm"

export class AddAmountToDeposits1697146558143 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('deposits', new TableColumn({
            name: 'amount',
            type: 'decimal',
            precision: 36,
            scale: 18,
            isNullable: false,
            default: 0,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('deposits', 'amount');
    }


}
