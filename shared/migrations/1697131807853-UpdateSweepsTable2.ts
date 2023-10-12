import {MigrationInterface, QueryRunner, TableColumn} from "typeorm"

export class UpdateSweepsTable21697131807853 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('sweeps', new TableColumn({
            name: 'token_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('sweeps', 'token_name')
    }

}
