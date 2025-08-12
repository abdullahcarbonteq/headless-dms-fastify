import test from "node:test";
import { strict as assert } from "node:assert";
import { Result } from "@carbonteq/fp";

import { GetAllUsersUseCase } from "../../src/application/use-cases/user/GetAllUsersUseCase.js";
import type { UserRepositoryPort, PaginatedResult } from "../../src/application/ports/UserRepositoryPort.js";
import type { ILogger } from "../../src/shared/interfaces/ILogger.js";
import { UserFactory } from "../../src/domain/entities/user/UserFactory.js";

function logger(): ILogger {
  return { debug() {}, info() {}, warn() {}, error() {}, child() { return this; } } as unknown as ILogger;
}

test("GetAllUsersUseCase: returns array", async () => {
  const u = UserFactory.createUser({
    name: "John Doe",
    email: "john@example.com",
    passwordHash: "$2b$10$012345678901234567890u",
    role: "user",
  }).unwrap();

  const repo: UserRepositoryPort = {
    createUser: async (x) => Result.Ok(x),
    findByEmail: async () => Result.Ok(u),
    findById: async () => Result.Ok(u),
    updateUser: async (x) => Result.Ok(x),
    deleteUser: async () => Result.Ok(true),
    getAllUsers: async () => Result.Ok([u]),
  };

  const uc = new GetAllUsersUseCase(repo, logger());
  const res = await uc.execute();
  assert.equal(res.isOk(), true);
  const val = res.unwrap();
  assert.ok(Array.isArray(val));
  assert.equal(val[0].email, "john@example.com");
});

test("GetAllUsersUseCase: returns paginated", async () => {
  const u = UserFactory.createUser({
    name: "John Doe",
    email: "john@example.com",
    passwordHash: "$2b$10$012345678901234567890u",
    role: "user",
  }).unwrap();

  const page: PaginatedResult<typeof u> = {
    data: [u],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  } as any;

  const repo: UserRepositoryPort = {
    createUser: async (x) => Result.Ok(x),
    findByEmail: async () => Result.Ok(u),
    findById: async () => Result.Ok(u),
    updateUser: async (x) => Result.Ok(x),
    deleteUser: async () => Result.Ok(true),
    getAllUsers: async () => Result.Ok(page as any),
  };

  const uc = new GetAllUsersUseCase(repo, logger());
  const res = await uc.execute({ page: 1, limit: 10 });
  assert.equal(res.isOk(), true);
  const val = res.unwrap() as any;
  assert.ok(Array.isArray(val.data));
  assert.equal(val.data[0].email, "john@example.com");
  assert.equal(val.total, 1);
});

