import test from "node:test";
import { strict as assert } from "node:assert";
import { Result } from "@carbonteq/fp";
import { UpdateUserUseCase } from "../../src/application/use-cases/user/UpdateUserUseCase.js";
import { UserFactory } from "../../src/domain/entities/user/UserFactory.js";
function logger() {
    return { debug() { }, info() { }, warn() { }, error() { }, child() { return this; } };
}
function authStub() {
    return {
        hashPassword: async (p) => Result.Ok("irrelevant"),
        comparePassword: async () => Result.Ok(true),
        generateToken: async () => Result.Ok("irrelevant"),
        verifyToken: async () => Result.Ok({ userId: "u1", role: "user", email: "u@e.com" }),
        generateDownloadToken: async () => Result.Ok("dl"),
        verifyDownloadToken: async () => Result.Ok({ docId: "d1" }),
    };
}
test("UpdateUserUseCase: success (name change)", async () => {
    const user = UserFactory.createUser({
        name: "John Doe",
        email: "john@example.com",
        passwordHash: "$2b$10$012345678901234567890u",
        role: "user",
    }).unwrap();
    let updatedPassed = null;
    const repo = {
        createUser: async () => Result.Ok(user),
        findByEmail: async () => Result.Ok(user),
        findById: async () => Result.Ok(user),
        updateUser: async (u) => { updatedPassed = u; return Result.Ok(u); },
        deleteUser: async () => Result.Ok(true),
        getAllUsers: async () => Result.Ok([user]),
    };
    const uc = new UpdateUserUseCase(repo, authStub(), logger());
    const res = await uc.execute({ id: user.id, name: "Johnny" });
    assert.equal(res.isOk(), true);
    assert.ok(updatedPassed);
    assert.equal(updatedPassed.name, "Johnny");
});
test("UpdateUserUseCase: invalid email", async () => {
    const user = UserFactory.createUser({
        name: "John Doe",
        email: "john@example.com",
        passwordHash: "$2b$10$012345678901234567890u",
        role: "user",
    }).unwrap();
    const repo = {
        createUser: async () => Result.Ok(user),
        findByEmail: async () => Result.Ok(user),
        findById: async () => Result.Ok(user),
        updateUser: async (u) => Result.Ok(u),
        deleteUser: async () => Result.Ok(true),
        getAllUsers: async () => Result.Ok([user]),
    };
    const uc = new UpdateUserUseCase(repo, authStub(), logger());
    const res = await uc.execute({ id: user.id, email: "bad-email" });
    assert.equal(res.isErr(), true);
});
