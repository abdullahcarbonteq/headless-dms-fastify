import 'reflect-metadata';
import { container } from 'tsyringe';
import { ILogger } from '../../shared/interfaces/ILogger.js';
import { CompositeLogger } from '../logging/CompositeLogger.js';
import { DrizzleUserRepository as InfraDrizzleUserRepository } from '../persistence/DrizzleUserRepository.js';
import { DrizzleDocumentRepository as InfraDrizzleDocumentRepository } from '../persistence/DrizzleDocumentRepository.js';
import { FileSystemStorageAdapter } from '../files/FileSystemStorageAdapter.js';
import { IConfigurationService } from '../../shared/interfaces/IConfigurationService.js';
import { ConfigurationService } from '../config/ConfigurationService.js';
import type { AuthPort } from '../../application/ports/AuthPort.js';
import { JWTAuthService } from '../auth/JWTAuthService.js';
import { BusinessRuleService } from '../../application/services/BusinessRuleService.js';

// Register logger
container.registerSingleton<ILogger>('ILogger', CompositeLogger);

// Register configuration service
container.registerSingleton<IConfigurationService>('IConfigurationService', ConfigurationService);

// Register application-port tokens mapping to infrastructure adapters (string tokens for now)
container.registerSingleton('UserRepositoryPort', InfraDrizzleUserRepository);
container.registerSingleton('DocumentRepositoryPort', InfraDrizzleDocumentRepository);
container.registerSingleton('FileStoragePort', FileSystemStorageAdapter);

// Register auth service (infra adapter)
container.registerSingleton<AuthPort>('AuthPort', JWTAuthService);

// Register business rule service
container.registerSingleton<BusinessRuleService>('BusinessRuleService', BusinessRuleService);

export { container }; 