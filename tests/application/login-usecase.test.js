import test from "node:test";
import { strict as assert } from "node:assert";
import { Result } from "@carbonteq/fp";
//import 'reflect-metadata'
import { LoginUserUseCase } from "../../src/application/use-cases/user/LoginUserUseCase.js";
import { UserFactory } from "../../src/domain/entities/user/UserFactory.js";
function makeLogger() {
    return {
        debug() { }, info() { }, warn() { }, error() { },
        child() { return this; }
    };
}
test("LoginUserUseCase: success", async () => {
    const userRes = UserFactory.createUser({
        name: "John Doe",
        email: "john@example.com",
        passwordHash: "$2b$10$012345678901234567890u",
        role: "user",
    });
    assert.equal(userRes.isOk(), true);
    const user = userRes.unwrap();
    const userRepo = {
        findByEmail: async () => Result.Ok(user),
    };
    const auth = {
        hashPassword: async () => Result.Ok("irrelevant"),
        comparePassword: async (password, hash) => Result.Ok(password === "secret"),
        generateToken: async () => Result.Ok("token-123"),
        verifyToken: async () => Result.Ok({ userId: "u1", role: "user", email: "user@example.com" }),
        generateDownloadToken: async () => Result.Ok("dl-token"),
        verifyDownloadToken: async () => Result.Ok({ docId: "doc-1" }),
    };
    const uc = new LoginUserUseCase(userRepo, auth, makeLogger());
    const out = await uc.execute({ email: "john@example.com", password: "secret" });
    assert.equal(out.isOk(), true);
    assert.equal(out.unwrap().token, "token-123");
});
test("LoginUserUseCase: wrong password", async () => {
    const userRes = UserFactory.createUser({
        name: "John Doe",
        email: "john@example.com",
        passwordHash: "$2b$10$012345678901234567890u",
        role: "user",
    });
    const user = userRes.unwrap();
    const userRepo = {
        findByEmail: async () => Result.Ok(user),
    };
    const auth = {
        hashPassword: async () => Result.Ok("irrelevant"),
        comparePassword: async (password, hash) => Result.Ok(false),
        generateToken: async () => Result.Ok("token-123"),
        verifyToken: async () => Result.Ok({ userId: "u1", role: "user", email: "user@example.com" }),
        generateDownloadToken: async () => Result.Ok("dl-token"),
        verifyDownloadToken: async () => Result.Ok({ docId: "doc-1" }),
    };
    const uc = new LoginUserUseCase(userRepo, auth, makeLogger());
    const out = await uc.execute({ email: "john@example.com", password: "wrong" });
    assert.equal(out.isErr(), true);
});
test("LoginUserUseCase: email not found", async () => {
    const userRepo = {
        findByEmail: async () => Result.Ok(null),
    };
    const auth = {
        hashPassword: async () => Result.Ok("irrelevant"),
        comparePassword: async (password, hash) => Result.Ok(password === "secret"),
        generateToken: async () => Result.Ok("token-123"),
        verifyToken: async () => Result.Ok({ userId: "u1", role: "user", email: "user@example.com" }),
        generateDownloadToken: async () => Result.Ok("dl-token"),
        verifyDownloadToken: async () => Result.Ok({ docId: "doc-1" }),
    };
    const uc = new LoginUserUseCase(userRepo, auth, makeLogger());
    const out = await uc.execute({ email: "missing@example.com", password: "secret" });
    assert.equal(out.isErr(), true);
});
