import test from "node:test";
import { strict as assert } from "node:assert";
import { Result } from "@carbonteq/fp";
import { RegisterUserUseCase } from "../../src/application/use-cases/user/RegisterUserUseCase.js";
function logger() {
    return { debug() { }, info() { }, warn() { }, error() { }, child() { return this; } };
}
test("RegisterUserUseCase: success", async () => {
    const repo = {
        createUser: async (u) => Result.Ok(u),
        findByEmail: async () => Result.Ok(null),
        findById: async () => Result.Ok(null),
        updateUser: async (u) => Result.Ok(u),
        deleteUser: async () => Result.Ok(true),
        getAllUsers: async () => Result.Ok([]),
    };
    const auth = {
        hashPassword: async () => Result.Ok("$2b$10$012345678901234567890u"),
        comparePassword: async () => Result.Ok(true),
        generateToken: async () => Result.Ok("irrelevant"),
        verifyToken: async () => Result.Ok({ userId: "u1", role: "user", email: "u@e.com" }),
        generateDownloadToken: async () => Result.Ok("dl"),
        verifyDownloadToken: async () => Result.Ok({ docId: "d1" }),
    };
    const uc = new RegisterUserUseCase(repo, auth, logger());
    const res = await uc.execute({ name: "John Doe", email: "john@example.com", password: "Secret123!", role: "user" });
    assert.equal(res.isOk(), true);
    const out = res.unwrap();
    assert.equal(out.name, "John Doe");
    assert.equal(out.email, "john@example.com");
    assert.equal(out.role, "user");
});
test("RegisterUserUseCase: hash failure", async () => {
    const repo = {
        createUser: async (u) => Result.Ok(u),
        findByEmail: async () => Result.Ok(null),
        findById: async () => Result.Ok(null),
        updateUser: async (u) => Result.Ok(u),
        deleteUser: async () => Result.Ok(true),
        getAllUsers: async () => Result.Ok([]),
    };
    const auth = {
        hashPassword: async () => Result.Err(new Error("hash failed")),
        comparePassword: async () => Result.Ok(true),
        generateToken: async () => Result.Ok("irrelevant"),
        verifyToken: async () => Result.Ok({ userId: "u1", role: "user", email: "u@e.com" }),
        generateDownloadToken: async () => Result.Ok("dl"),
        verifyDownloadToken: async () => Result.Ok({ docId: "d1" }),
    };
    const uc = new RegisterUserUseCase({}, auth, logger());
    const res = await uc.execute({ name: "John Doe", email: "john@example.com", password: "Secret123!", role: "user" });
    assert.equal(res.isErr(), true);
});
test("RegisterUserUseCase: repo create failure", async () => {
    const repo = {
        createUser: async () => Result.Err(new Error("db")),
        findByEmail: async () => Result.Ok(null),
        findById: async () => Result.Ok(null),
        updateUser: async (u) => Result.Ok(u),
        deleteUser: async () => Result.Ok(true),
        getAllUsers: async () => Result.Ok([]),
    };
    const auth = {
        hashPassword: async () => Result.Ok("$2b$10$012345678901234567890u"),
        comparePassword: async () => Result.Ok(true),
        generateToken: async () => Result.Ok("irrelevant"),
        verifyToken: async () => Result.Ok({ userId: "u1", role: "user", email: "u@e.com" }),
        generateDownloadToken: async () => Result.Ok("dl"),
        verifyDownloadToken: async () => Result.Ok({ docId: "d1" }),
    };
    const uc = new RegisterUserUseCase(repo, auth, logger());
    const res = await uc.execute({ name: "John Doe", email: "john@example.com", password: "Secret123!", role: "user" });
    assert.equal(res.isErr(), true);
});
