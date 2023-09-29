import { Container } from 'inversify';
import { IBlockchainService, IDatabaseService } from './interfaces';
import { BlockchainService } from '../shared/services/BlockchainService';
import { DatabaseService } from '../shared/services/DatabaseService';
import types from './types';
const container = new Container();

container.bind<IBlockchainService>(types.Blockchain).to(BlockchainService);
container.bind<IDatabaseService>(types.Database).to(DatabaseService);

export { container };
