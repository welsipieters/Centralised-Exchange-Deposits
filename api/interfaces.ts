import {DepositAddress} from "./models/DepositAddress";

export interface IBlockchainService {
    generateAddresses(count: number): Promise<string[]>;
}

export interface IDatabaseService {
    saveAddress(address: string): Promise<DepositAddress>;
    fetchAndMarkUnusedAddress(): Promise<DepositAddress | null>;
    findAddressById(id: number): Promise<DepositAddress | undefined>;
    deleteAddress(address: DepositAddress): Promise<void>;
}
