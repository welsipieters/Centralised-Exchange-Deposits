import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('sweeps')
export class Sweep {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 42 })
    address: string;

    @Column('decimal', { precision: 36, scale: 18 })
    amount: string;

    @Column({ type: 'varchar', length: 66 })
    transactionHash: string;

    @Column({ type: 'varchar', length: 42, nullable: true })
    tokenContractAddress: string;

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'bigint', nullable: true })
    block: number;
}
