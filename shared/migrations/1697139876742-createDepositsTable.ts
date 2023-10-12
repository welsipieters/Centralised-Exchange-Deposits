import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateDepositsTable1697139876742 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'deposits',
            columns: [
                {
                    name: 'id',
                    type: 'int',
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: 'increment',
                },
                {
                    name: 'transaction_id',
                    type: 'varchar',
                    isUnique: true,
                },
                {
                    name: 'block_number',
                    type: 'bigint',
                },
                {
                    name: 'from_address',
                    type: 'varchar',
                    length: '42',
                },
                {
                    name: 'to_address',
                    type: 'varchar',
                    length: '42',
                },
                {
                    name: 'currency_address',
                    type: 'varchar',
                    length: '42',
                },
                {
                    name: 'currency_name',
                    type: 'varchar',
                },
                {
                    name: 'hash',
                    type: 'varchar',
                    isUnique: true,
                },
            ],
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('deposits');
    }
}
