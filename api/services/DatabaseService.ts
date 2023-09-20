import { getRepository, Repository } from 'typeorm';
import { DepositAddress, AddressStatus } from '../models/DepositAddress';
import { injectable } from 'inversify';
import {IDatabaseService} from "../interfaces";

@injectable()
export class DatabaseService implements IDatabaseService{

    private depositAddressRepository: Repository<DepositAddress>;

    constructor() {
        this.depositAddressRepository = getRepository(DepositAddress);
    }

    /**
     * Saves a new deposit address to the database.
     * @param address The deposit address to save.
     */
    async saveAddress(address: string): Promise<DepositAddress> {
        const depositAddress = new DepositAddress();
        depositAddress.deposit_address = address;
        depositAddress.status = AddressStatus.UNUSED;

        return await this.depositAddressRepository.save(depositAddress);
    }

    /**
     * Fetches an unused deposit address and marks it as in-use.
     * @returns The deposit address or null if none is found.
     */
    async fetchAndMarkUnusedAddress(): Promise<DepositAddress | null> {
        const unusedAddress = await this.depositAddressRepository.findOne({
            where: { status: AddressStatus.UNUSED },
            order: { createdAt: 'ASC' }
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
    async findAddressById(id: number): Promise<DepositAddress | undefined> {
        return await this.depositAddressRepository.findOne(id);
    }

    /**
     * Deletes a deposit address from the database.
     * @param address The deposit address to delete.
     */
    async deleteAddress(address: DepositAddress): Promise<void> {
        await this.depositAddressRepository.remove(address);
    }



}
