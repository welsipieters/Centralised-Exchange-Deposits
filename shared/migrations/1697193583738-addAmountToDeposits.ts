import {MigrationInterface, QueryRunner, TableColumn} from "typeorm"

export class AddAmountToDeposits1697193583738 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('deposits', new TableColumn({
            name: 'amount_real',
            type: 'decimal',
            precision: 36,
            scale: 18,
            isNullable: false,
            default: 0,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('deposits', 'amount_real');
    }
}
