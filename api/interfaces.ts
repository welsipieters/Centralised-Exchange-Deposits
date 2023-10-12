import {DepositAddress} from "../shared/models/DepositAddress";
import {Sweep} from "../shared/models/Sweep";

export interface IBlockchainService {
    generateAddresses(count: number): Promise<string>;
}

export interface IDatabaseService {
    saveAddress(address: string, block: number): Promise<DepositAddress>;
    fetchAndMarkUnusedAddress(): Promise<DepositAddress | null>;
    findAddressById(id: number): Promise<DepositAddress | null>;
    deleteAddress(address: DepositAddress): Promise<void>;
    fetchSweepsWithLowNotifications(): Promise<Sweep[]>;
    updateSweepNotificationCount(sweepId: number): Promise<void>
    updateMultipleSweepNotificationCounts(sweepIds: number[]): Promise<void>
    fetchAllInUseAddresses(): Promise<DepositAddress[]>;
    updateLastSeenAtBlockForAddresses(depositAddresses: DepositAddress[], block: number): Promise<void>;
}
