import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { Result } from "@carbonteq/fp";
import sinon from 'sinon';

import { RegisterUserUseCase } from "../../src/application/use-cases/user/RegisterUserUseCase.js";
import type { UserRepositoryPort } from "../../src/application/ports/UserRepositoryPort.js";
import type { AuthPort } from "../../src/application/ports/AuthPort.js";
import type { ILogger } from "../../src/shared/interfaces/ILogger.js";
import type { RegisterUserInput } from "../../src/application/dto/user/RegisterUserDTO.js";
import { GenericTestHelpers } from '../helpers/generic-test-helpers.js';

describe('RegisterUserUseCase', () => {
  let userRepo: UserRepositoryPort;
  let auth: AuthPort;
  let logger: ILogger;
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    // Create mock logger
    logger = {
      debug: sinon.stub(),
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      child: () => logger
    } as unknown as ILogger;
    
    // Create mock user repository
    userRepo = {
      findByEmail: sinon.stub(),
      createUser: sinon.stub(),
      findById: sinon.stub(),
      updateUser: sinon.stub(),
      deleteUser: sinon.stub(),
      getAllUsers: sinon.stub()
    } as unknown as UserRepositoryPort;
    
    // Create mock auth service
    auth = {
      hashPassword: sinon.stub(),
      comparePassword: sinon.stub(),
      generateToken: sinon.stub(),
      verifyToken: sinon.stub(),
      generateDownloadToken: sinon.stub(),
      verifyDownloadToken: sinon.stub()
    } as unknown as AuthPort;
    
    // Create use case instance
    useCase = new RegisterUserUseCase(userRepo, auth, logger);
  });

  describe('execute', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const input: RegisterUserInput = { 
        name: "John Doe", 
        email: "john@example.com", 
        password: "secret", 
        role: "user" 
      };
      
      // Mock successful responses
      (userRepo.findByEmail as sinon.SinonStub).resolves(Result.Ok(null));
      (userRepo.createUser as sinon.SinonStub).resolves(Result.Ok({ 
        id: "u1", 
        name: "John Doe", 
        email: "john@example.com", 
        role: "user" 
      }));
      (auth.hashPassword as sinon.SinonStub).resolves(Result.Ok("$2b$10$012345678901234567890u"));

      // Act
      const result = await useCase.execute(input);

      // Assert
      GenericTestHelpers.assertSuccess(result);
      expect(result.unwrap().name).to.equal("John Doe");
      expect(result.unwrap().email).to.equal("john@example.com");
      expect(result.unwrap().role).to.equal("user");
    });

    it('should fail when email already exists', async () => {
      // Arrange
      const input: RegisterUserInput = { 
        name: "John Doe", 
        email: "john@example.com", 
        password: "secret", 
        role: "user" 
      };
      
      // Mock that user creation fails due to duplicate email constraint
      (userRepo.findByEmail as sinon.SinonStub).resolves(Result.Ok(null));
      (auth.hashPassword as sinon.SinonStub).resolves(Result.Ok("$2b$10$012345678901234567890u"));
      (userRepo.createUser as sinon.SinonStub).resolves(Result.Err(new Error('Duplicate email constraint')));

      // Act
      const result = await useCase.execute(input);

      // Assert
      GenericTestHelpers.assertError(result);
      expect(result.unwrapErr().message).to.include('Failed to create user');
    });

    it('should fail when password hashing fails', async () => {
      // Arrange
      const input: RegisterUserInput = { 
        name: "John Doe", 
        email: "john@example.com", 
        password: "secret", 
        role: "user" 
      };
      
      // Mock that user doesn't exist but password hashing fails
      (userRepo.findByEmail as sinon.SinonStub).resolves(Result.Ok(null));
      (auth.hashPassword as sinon.SinonStub).resolves(Result.Err(new Error('Hashing failed')));

      // Act
      const result = await useCase.execute(input);

      // Assert
      GenericTestHelpers.assertError(result);
      expect(result.unwrapErr().message).to.include('Failed to hash password');
    });

    it('should fail when user creation fails', async () => {
      // Arrange
      const input: RegisterUserInput = { 
        name: "John Doe", 
        email: "john@example.com", 
        password: "secret", 
        role: "user" 
      };
      
      // Mock that user doesn't exist, hashing succeeds, but creation fails
      (userRepo.findByEmail as sinon.SinonStub).resolves(Result.Ok(null));
      (auth.hashPassword as sinon.SinonStub).resolves(Result.Ok("$2b$10$012345678901234567890u"));
      (userRepo.createUser as sinon.SinonStub).resolves(Result.Err(new Error('Database error')));

      // Act
      const result = await useCase.execute(input);

      // Assert
      GenericTestHelpers.assertError(result);
      expect(result.unwrapErr().message).to.include('Failed to create user');
    });
  });
});

