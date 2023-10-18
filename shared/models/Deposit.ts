import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Unique,
} from 'typeorm';

@Entity('deposits')
@Unique([   'hash', 'process_tx'])
export class Deposit {

    @PrimaryGeneratedColumn()
    id: number;


    @Column('bigint', { name: 'block_number' })
    blockNumber: number;

    @Column('varchar', { length: 42, name: 'from_address' })
    fromAddress: string;

    @Column('varchar', { length: 42, name: 'to_address' })
    toAddress: string;

    @Column('varchar', { length: 42, name: 'currency_address' })
    currencyAddress: string;

    @Column('varchar', { name: 'currency_name' })
    currencyName: string;

    @Column('varchar', { name: 'hash' })
    hash: string;

    @Column('varchar', { name: 'process_tx' })
    process_tx: string;

    @Column({ type: 'boolean', default: false })
    processed: boolean;

    @Column({ type: 'decimal', precision: 36, scale: 18 })
    amount: string;

    @Column({ type: 'decimal', precision: 36, scale: 18 })
    amount_real: bigint;


}
