import test from "node:test";
import { strict as assert } from "node:assert";
import { UserFactory } from "../../src/domain/entities/user/UserFactory.js";
import { DocumentFactory } from "../../src/domain/entities/document/DocumentFactory.js";
// USER FACTORY
test("UserFactory.createUser: happy path (user)", () => {
    const r = UserFactory.createUser({
        name: "Jane Doe",
        email: "Jane.Doe@Example.com",
        passwordHash: "$2b$10$012345678901234567890u",
        role: "user",
    });
    assert.equal(r.isOk(), true);
    const u = r.unwrap();
    assert.equal(u.name, "Jane Doe");
    assert.equal(u.email, "jane.doe@example.com");
    assert.equal(u.role, "user");
});
test("UserFactory.createUser: happy path (admin)", () => {
    const r = UserFactory.createAdminUser("Admin User", "ADMIN@example.com", "$2b$10$012345678901234567890u");
    assert.equal(r.isOk(), true);
    const u = r.unwrap();
    assert.equal(u.role, "admin");
    assert.equal(u.email, "admin@example.com");
});
test("UserFactory.createUser: invalid email", () => {
    const r = UserFactory.createUser({
        name: "John",
        email: "not-an-email",
        passwordHash: "$2b$10$012345678901234567890u",
        role: "user",
    });
    assert.equal(r.isErr(), true);
});
test("UserFactory.createUser: invalid name", () => {
    const r = UserFactory.createUser({
        name: "a",
        email: "john@example.com",
        passwordHash: "$2b$10$012345678901234567890u",
        role: "user",
    });
    assert.equal(r.isErr(), true);
});
test("UserFactory.createUser: invalid passwordHash", () => {
    const r = UserFactory.createUser({
        name: "John Doe",
        email: "john@example.com",
        passwordHash: "short",
        role: "user",
    });
    assert.equal(r.isErr(), true);
});
test("UserFactory.createUser: invalid role", () => {
    // @ts-expect-error: testing invalid role
    const r = UserFactory.createUser({
        name: "John Doe",
        email: "john@example.com",
        passwordHash: "$2b$10$012345678901234567890u",
        role: "superuser",
    });
    assert.equal(r.isErr(), true);
});
// DOCUMENT FACTORY
test("DocumentFactory.createDocument: happy path with normalization", () => {
    const r = DocumentFactory.createDocument({
        filename: "report.pdf",
        mimetype: "application/pdf",
        path: "/uploads/report.pdf",
        tags: [" alpha ", "alpha", "beta", "beta"],
        description: "Quarterly report",
        userId: "user-123",
    });
    assert.equal(r.isOk(), true);
    const d = r.unwrap();
    assert.equal(d.filename, "report.pdf");
    assert.equal(d.mimetype, "application/pdf");
    assert.equal(d.path, "/uploads/report.pdf");
    assert.deepEqual(d.tags, ["alpha", "beta"]); // deduped and trimmed
    assert.equal(d.description, "Quarterly report");
    assert.equal(d.userId, "user-123");
});
test("DocumentFactory.createDocument: invalid filename", () => {
    const r = DocumentFactory.createDocument({
        filename: "",
        mimetype: "application/pdf",
        path: "/uploads/report.pdf",
        userId: "user-123",
    });
    assert.equal(r.isErr(), true);
});
test("DocumentFactory.createDocument: invalid mimetype", () => {
    const r = DocumentFactory.createDocument({
        filename: "doc.xyz",
        mimetype: "random/type",
        path: "/uploads/doc.xyz",
        userId: "user-123",
    });
    assert.equal(r.isErr(), true);
});
test("DocumentFactory.createDocument: invalid path", () => {
    const r = DocumentFactory.createDocument({
        filename: "report.pdf",
        mimetype: "application/pdf",
        path: "",
        userId: "user-123",
    });
    assert.equal(r.isErr(), true);
});
test("DocumentFactory.createDocument: invalid tags (too many)", () => {
    const many = Array.from({ length: 60 }).map((_, i) => `t${i}`);
    const r = DocumentFactory.createDocument({
        filename: "report.pdf",
        mimetype: "application/pdf",
        path: "/uploads/report.pdf",
        tags: many,
        userId: "user-123",
    });
    assert.equal(r.isErr(), true);
});
test("DocumentFactory.createDocument: description too long", () => {
    const long = "x".repeat(1001);
    const r = DocumentFactory.createDocument({
        filename: "report.pdf",
        mimetype: "application/pdf",
        path: "/uploads/report.pdf",
        description: long,
        userId: "user-123",
    });
    assert.equal(r.isErr(), true);
});
