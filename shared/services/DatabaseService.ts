import {getRepository, IsNull, LessThan, Not, Repository} from 'typeorm';
import {DepositAddress} from '../models/DepositAddress';
import {injectable} from 'inversify';
import {IDatabaseService} from "../../api/interfaces";
import {AddressStatus} from "../models/enums/AddressStatus";
import {Sweep} from "../models/Sweep";
import {Deposit} from "../models/Deposit";

@injectable()
export class DatabaseService implements IDatabaseService {

    private depositAddressRepository: Repository<DepositAddress>;
    private depositRepository: Repository<Deposit>;
    private sweepRepository: Repository<Sweep>;

    constructor() {
        this.depositAddressRepository = getRepository(DepositAddress);
        this.depositRepository = getRepository(Deposit);
        this.sweepRepository = getRepository(Sweep);
    }

    /**
     * Saves a new deposit address to the database.
     * @param address The deposit address to save.
     * @param block
     */
    async saveAddress(address: string, block: number): Promise<DepositAddress> {
        const depositAddress = new DepositAddress();
        depositAddress.deposit_address = address;
        depositAddress.status = AddressStatus.UNUSED;
        depositAddress.last_seen_at_block = block;

        return this.depositAddressRepository.save(depositAddress);
    }

    /**
     * Fetches an unused deposit address and marks it as in-use.
     * @returns The deposit address or null if none is found.
     */
    async fetchAndMarkUnusedAddress(): Promise<DepositAddress | null> {
        const unusedAddress = await this.depositAddressRepository.findOne({
            where: { status: AddressStatus.UNUSED },
            order: { created_at: 'ASC' }
        });

        if (!unusedAddress) {
            return null;
        }

        unusedAddress.status = AddressStatus.IN_USE;
        await this.depositAddressRepository.save(unusedAddress);

        return unusedAddress;
    }

    async updateLastSeenBalance(addressString: string, newBalance: string): Promise<DepositAddress | null> {
        try {
            // Attempt to update the last seen balance for the given address.
            const result = await this.depositAddressRepository.update(
                { deposit_address: addressString },
                { last_seen_balance: newBalance }
            );

            // Check if the address was updated and return the updated address, otherwise return null.
            return result.affected ? await this.depositAddressRepository.findOne({ where: { deposit_address: addressString } }) : null;
        } catch (error) {
            console.error('Error updating last seen balance:', error);
            return null;
        }
    }
    /**
     * Finds a deposit address by its ID.
     * @param id The ID of the deposit address.
     */
    async findAddressById(id: number): Promise<DepositAddress | null> {
        return await this.depositAddressRepository.findOne({where: {id: id}});
    }




    /**
     * Deletes a deposit address from the database.
     * @param address The deposit address to delete.
     */
    async deleteAddress(address: DepositAddress): Promise<void> {
        await this.depositAddressRepository.remove(address);
    }

    /**
     * Fetches all sweeps with core_notifications of less than 5.
     * @returns An array of sweeps that need to be notified.
     */
    async fetchSweepsWithLowNotifications(): Promise<Sweep[]> {
        return await this.sweepRepository.find({
            where: {
                core_notifications: LessThan(5),
                processed: true
            }
        });
    }

    async checkUnprocessedSweepByAddress(toAddress: string): Promise<boolean> {
        const unprocessedSweepExists = await this.sweepRepository.count({
            where: {
                tokenContractAddress: "0x0000000",
                address: toAddress,
                processed: false
            }
        });

        return unprocessedSweepExists > 0;
    }

    async updateSweepConfirmed(id: number): Promise<void> {
        const sweepToUpdate = await this.sweepRepository.findOneBy({id: id});
        if (sweepToUpdate) {
            sweepToUpdate.processed = true;
            await this.sweepRepository.save(sweepToUpdate);
        }
    }

    async fetchSweepsWithUnconfirmedTransaction(): Promise<Sweep[]> {
        return await this.sweepRepository.find({
            where: {
                sweepHash: Not(IsNull()),
                processed: false
            }
        });
    }

    /**
     * Increments the core_notifications value for a given sweep by 1.
     * @param sweepId The ID of the sweep.
     */
    async updateSweepNotificationCount(sweepId: number): Promise<void> {
        const sweepToUpdate = await this.sweepRepository.findOneBy({id: sweepId});
        if (sweepToUpdate) {
            sweepToUpdate.core_notifications += 1;
            await this.sweepRepository.save(sweepToUpdate);
        }
    }




    async updateMultipleSweepNotificationCounts(sweepIds: number[]): Promise<void> {
        await this.sweepRepository
            .createQueryBuilder()
            .update()
            .set({
                core_notifications: () => "core_notifications + 1"
            })
            .whereInIds(sweepIds)
            .execute();
    }


    async findUnprocessedTokenDepositsByToAddress(toAddress: string): Promise<Deposit[]> {
        return await this.depositRepository.find({
            where: {
                toAddress: toAddress,
                processed: false,
                currencyAddress: Not('0x0')
            }
        });
    }

    async findUnprocessedEthDepositsByToAddress(toAddress: string): Promise<Deposit[]> {
        return await this.depositRepository.find({
            where: {
                toAddress: toAddress,
                currencyAddress: '0x0',
                processed: false
            }
        });
    }

    async updateProcessedStatusByHash(transactionHash: string, processTx: string|null, processed: boolean): Promise<void> {
        await this.depositRepository.update({ hash: transactionHash }, { processed: processed, process_tx: processTx });
    }

    async findDepositByHash(hash: string): Promise<Deposit | null> {
        return await this.depositRepository.findOne({where: {hash: hash}});
    }

    async insertDeposit(depositData: Deposit): Promise<Deposit> {

        return await this.depositRepository.save(depositData);
    }


    async fetchAllInUseAddresses(): Promise<DepositAddress[]> {
        return await this.depositAddressRepository.find({
            where: {status: AddressStatus.IN_USE}
        });
    }

    async updateLastSeenAtBlockForAddresses(depositAddresses: DepositAddress[], block: number): Promise<void> {
        for (let address of depositAddresses) {
            address.last_seen_at_block = block;
        }

        await this.depositAddressRepository.save(depositAddresses);
    }



}
