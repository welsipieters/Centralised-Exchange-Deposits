

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { AddressStatus } from './enums/AddressStatus';

@Entity()
export class DepositAddress {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    deposit_address: string;

    @Column({
        type: 'enum',
        enum: AddressStatus,
        default: AddressStatus.UNUSED
    })
    status: AddressStatus;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    @Column({ type: 'bigint', nullable: true })
    last_seen_at_block: number;

    @Column({type: "varchar", nullable: true })
    last_seen_balance: string;
}
