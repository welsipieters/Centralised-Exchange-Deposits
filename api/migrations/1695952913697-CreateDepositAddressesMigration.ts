import {MigrationInterface, QueryRunner, Table, TableIndex} from "typeorm"

export class CreateDepositAddressesMigration1695952913697 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'deposit_address',
            columns: [
                {
                    name: 'id',
                    type: 'int',
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: 'increment',
                },
                {
                    name: 'deposit_address',
                    type: 'varchar',
                    isUnique: true,
                },
                {
                    name: 'status',
                    type: 'enum',
                    enum: ['unused', 'in-use'],
                    default: "'unused'"
                },
                {
                    name: 'created_at',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'updated_at',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                    onUpdate: 'CURRENT_TIMESTAMP',
                },
            ],
        }));

        await queryRunner.createIndex('deposit_address', new TableIndex({
            name: 'IDX_DEPOSIT_ADDRESS_STATUS',
            columnNames: ['status'],
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('deposit_address', 'IDX_DEPOSIT_ADDRESS_STATUS');
        await queryRunner.dropTable('deposit_address');
    }

}
