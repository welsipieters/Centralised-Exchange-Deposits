import {MigrationInterface, QueryRunner, TableColumn} from "typeorm"

export class UpdateSweepsTable1697127904508 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('sweeps', new TableColumn({
            name: 'core_notifications',
            type: 'int',
            default: 0,
        }));

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('sweeps', 'core_notifications');
    }

}
