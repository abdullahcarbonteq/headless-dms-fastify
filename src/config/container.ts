import 'reflect-metadata';
import { container } from 'tsyringe';
import { ILogger } from '../shared/interfaces/ILogger.js';
import { CompositeLogger } from '../shared/loggers/CompositeLogger.js';
import { IUserRepository } from '../modules/user/user.repository.interface.js';
import { DrizzleUserRepository } from '../modules/user/user.repository.js';
import { IDocumentRepository } from '../modules/document/document.repository.interface.js';
import { DrizzleDocumentRepository } from '../modules/document/document.repository.js';

// Register logger
container.registerSingleton<ILogger>('ILogger', CompositeLogger);

// Register repositories
container.registerSingleton<IUserRepository>('IUserRepository', DrizzleUserRepository);
container.registerSingleton<IDocumentRepository>('IDocumentRepository', DrizzleDocumentRepository);

export { container }; 