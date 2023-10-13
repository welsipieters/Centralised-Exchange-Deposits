import {DepositAddress} from "../shared/models/DepositAddress";
import {Sweep} from "../shared/models/Sweep";
import {Deposit} from "../shared/models/Deposit";

export interface IBlockchainService {
    generateAddresses(count: number): Promise<string>;
}

export interface IDatabaseService {
    updateProcessedStatusByHash(transactionHash: string, processed: boolean): Promise<void>
    findUnprocessedDepositsByToAddress(toAddress: string): Promise<Deposit[]>
    findDepositByHash(hash: string): Promise<Deposit | null>;
    saveAddress(address: string, block: number): Promise<DepositAddress>;
    fetchAndMarkUnusedAddress(): Promise<DepositAddress | null>;
    findAddressById(id: number): Promise<DepositAddress | null>;
    deleteAddress(address: DepositAddress): Promise<void>;
    fetchSweepsWithLowNotifications(): Promise<Sweep[]>;
    updateSweepNotificationCount(sweepId: number): Promise<void>
    updateMultipleSweepNotificationCounts(sweepIds: number[]): Promise<void>
    fetchAllInUseAddresses(): Promise<DepositAddress[]>;
    updateLastSeenAtBlockForAddresses(depositAddresses: DepositAddress[], block: number): Promise<void>;
    insertDeposit(depositData: Deposit): Promise<Deposit>;
}
