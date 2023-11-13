import {DepositAddress} from "../shared/models/DepositAddress";
import {Sweep} from "../shared/models/Sweep";
import {Deposit} from "../shared/models/Deposit";

export interface IBlockchainService {
    generateAddresses(count: number): Promise<string>;
    getTransactionConfirmations(txHash: string): Promise<number>;

}

export interface IDatabaseService {
    checkUnprocessedSweepByAddress(toAddress: string): Promise<boolean>
    updateLastSeenBalance(addressString: string, newBalance: string): Promise<DepositAddress | null>
    fetchSweepsWithUnconfirmedTransaction(): Promise<Sweep[]>;
    updateSweepConfirmed(id: number): Promise<void>;
    updateProcessedStatusByHash(transactionHash: string, processTx: string|null, processed: boolean): Promise<void>
    findUnprocessedTokenDepositsByToAddress(toAddress: string): Promise<Deposit[]>
    findUnprocessedEthDepositsByToAddress(toAddress: string): Promise<Deposit[]>
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
