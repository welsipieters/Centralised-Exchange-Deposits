import { Container } from 'inversify';
import { IBlockchainService, IDatabaseService } from './interfaces';
import { BlockchainService } from './services/BlockchainService';
import { DatabaseService } from './services/DatabaseService';
import types from './types';
const container = new Container();

container.bind<IBlockchainService>(types.Blockchain).to(BlockchainService);
container.bind<IDatabaseService>(types.Database).to(DatabaseService);

export { container };
