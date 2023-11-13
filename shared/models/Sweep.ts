import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('sweeps')
export class Sweep {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 42 })
    address: string;

    @Column('decimal', { precision: 36 })
    amount: string;

    @Column({ type: 'varchar', length: 66 })
    transactionHash: string;

    @Column({ type: 'varchar', length: 255 })
    token_name: string;

    @Column({ type: 'varchar', length: 42, nullable: true })
    tokenContractAddress: string;

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'bigint', nullable: true })
    block: bigint;

    @Column({ type: 'int', default: 0 })
    core_notifications: number;

    // New field: processed
    @Column({ type: 'boolean', default: false })
    processed: boolean;

    // New field: sweepHash
    @Column({ type: 'varchar', nullable: true })
    sweepHash: string|null;
}
