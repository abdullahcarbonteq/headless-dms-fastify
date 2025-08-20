import test from "node:test";
import { strict as assert } from "node:assert";
import { Result } from "@carbonteq/fp";
import { DeleteUserUseCase } from "../../src/application/use-cases/user/DeleteUserUseCase.js";
function logger() {
    return { debug() { }, info() { }, warn() { }, error() { }, child() { return this; } };
}
test("DeleteUserUseCase: success true", async () => {
    const repo = {
        createUser: async (x) => Result.Ok(x),
        findByEmail: async () => Result.Ok(null),
        findById: async () => Result.Ok(null),
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
    const repo = {
        createUser: async (x) => Result.Ok(x),
        findByEmail: async () => Result.Ok(null),
        findById: async () => Result.Ok(null),
        updateUser: async (x) => Result.Ok(x),
        deleteUser: async () => Result.Err(new Error("db")),
        getAllUsers: async () => Result.Ok([]),
    };
    const uc = new DeleteUserUseCase(repo, logger());
    const res = await uc.execute({ id: "u1" });
    assert.equal(res.isErr(), true);
});
