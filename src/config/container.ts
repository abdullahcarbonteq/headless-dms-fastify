import 'reflect-metadata';
import { container } from 'tsyringe';
import { ILogger } from '../shared/interfaces/ILogger.js';
import { CompositeLogger } from '../shared/loggers/CompositeLogger.js';
import { IUserRepository } from '../modules/user/interfaces/IUserRepository.js';
import { DrizzleUserRepository } from '../modules/user/repositories/DrizzleUserRepository.js';
import { IDocumentRepository } from '../modules/document/interfaces/IDocumentRepository.js';
import { DrizzleDocumentRepository } from '../modules/document/repositories/DrizzleDocumentRepository.js';

// Register logger
container.registerSingleton<ILogger>('ILogger', CompositeLogger);

// Register repositories
container.registerSingleton<IUserRepository>('IUserRepository', DrizzleUserRepository);
container.registerSingleton<IDocumentRepository>('IDocumentRepository', DrizzleDocumentRepository);

export { container }; 