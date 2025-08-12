import test from "node:test";
import { strict as assert } from "node:assert";
import { Result } from "@carbonteq/fp";

import { DeleteUserUseCase } from "../../src/application/use-cases/user/DeleteUserUseCase.js";
import type { UserRepositoryPort } from "../../src/application/ports/UserRepositoryPort.js";
import type { ILogger } from "../../src/shared/interfaces/ILogger.js";

function logger(): ILogger {
  return { debug() {}, info() {}, warn() {}, error() {}, child() { return this; } } as unknown as ILogger;
}

test("DeleteUserUseCase: success true", async () => {
  const repo: UserRepositoryPort = {
    createUser: async (x) => Result.Ok(x),
    findByEmail: async () => Result.Ok(null as any),
    findById: async () => Result.Ok(null as any),
    updateUser: async (x) => Result.Ok(x),
    deleteUser: async () => Result.Ok(true),
    getAllUsers: async () => Result.Ok([]),
  };

  const uc = new DeleteUserUseCase(repo, logger());
  const res = await uc.execute({ id: "u1" });
  assert.equal(res.isOk(), true);
  assert.equal(res.unwrap(), true);
});

test("DeleteUserUseCase: repo error", async () => {
  const repo: UserRepositoryPort = {
    createUser: async (x) => Result.Ok(x),
    findByEmail: async () => Result.Ok(null as any),
    findById: async () => Result.Ok(null as any),
    updateUser: async (x) => Result.Ok(x),
    deleteUser: async () => Result.Err(new Error("db")),
    getAllUsers: async () => Result.Ok([]),
  };

  const uc = new DeleteUserUseCase(repo, logger());
  const res = await uc.execute({ id: "u1" });
  assert.equal(res.isErr(), true);
});

