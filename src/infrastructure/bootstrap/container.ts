import 'reflect-metadata';
import { container } from 'tsyringe';
import { ILogger } from '../../shared/interfaces/ILogger.js';
import { CompositeLogger } from '../logging/CompositeLogger.js';
import { DrizzleUserRepository as InfraDrizzleUserRepository } from '../persistence/DrizzleUserRepository.js';
import { DrizzleDocumentRepository as InfraDrizzleDocumentRepository } from '../persistence/DrizzleDocumentRepository.js';
import { FileSystemStorageAdapter } from '../files/FileSystemStorageAdapter.js';
import { FileStorageStrategy } from '../files/FileStorageStrategy.js';
import { S3StorageAdapter } from '../files/S3StorageAdapter.js';
import { GCSStorageAdapter } from '../files/GCSStorageAdapter.js';
import { IConfigurationService } from '../../shared/interfaces/IConfigurationService.js';
import { AzureBlobStorageAdapter } from '../files/AzureBlobStorageAdapter.js';
import { ConfigurationService } from '../config/ConfigurationService.js';
import type { AuthPort } from '../../application/ports/AuthPort.js';
import { JWTAuthService } from '../auth/JWTAuthService.js';
import { NewRelicObservabilityService } from '../observability/NewRelicObservabilityService.js';
import type { IObservabilityService } from '../../shared/interfaces/IObservabilityService.js';

// Register logger
container.registerSingleton<ILogger>('ILogger', CompositeLogger);

// Register configuration service
container.registerSingleton<IConfigurationService>('IConfigurationService', ConfigurationService);

// Register application-port tokens mapping to infrastructure adapters (string tokens for now)
container.registerSingleton('UserRepositoryPort', InfraDrizzleUserRepository);
container.registerSingleton('DocumentRepositoryPort', InfraDrizzleDocumentRepository);
// Register concrete adapters under explicit tokens
container.registerSingleton('FileSystemStorageAdapter', FileSystemStorageAdapter);
// Cloud adapters
container.registerSingleton('S3StorageAdapter', S3StorageAdapter);
container.registerSingleton('GCSStorageAdapter', GCSStorageAdapter);
container.registerSingleton('AzureBlobStorageAdapter', AzureBlobStorageAdapter);
// container.registerSingleton('AzureBlobStorageAdapter', AzureBlobStorageAdapter);

// Register strategy as the main FileStoragePort
container.registerSingleton('FileStoragePort', FileStorageStrategy);

// Register auth service (infra adapter)
container.registerSingleton<AuthPort>('AuthPort', JWTAuthService);

// Observability service (no-op if NEW_RELIC_LICENSE_KEY absent)
container.registerSingleton<IObservabilityService>('IObservabilityService', NewRelicObservabilityService);


export { container }; 