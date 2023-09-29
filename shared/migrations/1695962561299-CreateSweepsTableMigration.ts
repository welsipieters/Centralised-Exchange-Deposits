import {MigrationInterface, QueryRunner, Table} from "typeorm"

export class CreateSweepsTableMigration1695962561299 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'sweeps',
            columns: [
                {
                    name: 'id',
                    type: 'int',
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: 'increment',
                },
                {
                    name: 'address',
                    type: 'varchar',
                    length: '42',
                },
                {
                    name: 'amount',
                    type: 'decimal',
                    precision: 36,
                    scale: 18,
                },
                {
                    name: 'transactionHash',
                    type: 'varchar',
                    length: '66',
                },
                {
                    name: 'tokenContractAddress',
                    type: 'varchar',
                    length: '42',
                    isNullable: true,
                },
                {
                    name: 'created_at',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'block',
                    type: 'bigint',
                    isNullable: true,
                },
            ],
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('sweeps');
    }
}
