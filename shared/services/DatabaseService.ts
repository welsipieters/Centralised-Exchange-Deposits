import {getRepository, LessThan, Repository} from 'typeorm';
import {DepositAddress} from '../models/DepositAddress';
import {injectable} from 'inversify';
import {IDatabaseService} from "../../api/interfaces";
import {AddressStatus} from "../models/enums/AddressStatus";
import {Sweep} from "../models/Sweep";

@injectable()
export class DatabaseService implements IDatabaseService {

    private depositAddressRepository: Repository<DepositAddress>;
    private sweepRepository: Repository<Sweep>;

    constructor() {
        this.depositAddressRepository = getRepository(DepositAddress);
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
        console.log('Saving address', depositAddress);
        return await this.depositAddressRepository.save(depositAddress);
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
            where: {core_notifications: LessThan(5)}
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
