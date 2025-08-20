import test from "node:test";
import { strict as assert } from "node:assert";
import { Result } from "@carbonteq/fp";
import { GetAllDocumentsUseCase } from "../../src/application/use-cases/document/GetAllDocumentsUseCase.js";
import { DocumentFactory } from "../../src/domain/entities/document/DocumentFactory.js";
function logger() {
    return { debug() { }, info() { }, warn() { }, error() { }, child() { return this; } };
}
test("GetAllDocumentsUseCase: returns array", async () => {
    const d = DocumentFactory.createDocument({
        filename: "a.pdf",
        mimetype: "application/pdf",
        path: "/uploads/a.pdf",
        tags: ["t1"],
        description: "desc",
        userId: "u1",
    }).unwrap();
    const repo = {
        createDocument: async (x) => Result.Ok(x),
        findById: async () => Result.Ok(d),
        getAllDocuments: async () => Result.Ok([d]),
        deleteDocument: async () => Result.Ok(true),
        searchDocuments: async () => Result.Ok([d]),
        updateDocument: async (x) => Result.Ok(x),
    };
    const uc = new GetAllDocumentsUseCase(repo, logger());
    const res = await uc.execute();
    assert.equal(res.isOk(), true);
    const val = res.unwrap();
    assert.ok(Array.isArray(val));
    assert.equal(val[0].filename, "a.pdf");
});
test("GetAllDocumentsUseCase: returns paginated", async () => {
    const d = DocumentFactory.createDocument({
        filename: "a.pdf",
        mimetype: "application/pdf",
        path: "/uploads/a.pdf",
        tags: ["t1"],
        description: "desc",
        userId: "u1",
    }).unwrap();
    const page = {
        data: [d],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
    };
    const repo = {
        createDocument: async (x) => Result.Ok(x),
        findById: async () => Result.Ok(d),
        getAllDocuments: async () => Result.Ok(page),
        deleteDocument: async () => Result.Ok(true),
        searchDocuments: async () => Result.Ok([d]),
        updateDocument: async (x) => Result.Ok(x),
    };
    const uc = new GetAllDocumentsUseCase(repo, logger());
    const res = await uc.execute({ page: 1, limit: 10 });
    assert.equal(res.isOk(), true);
    const val = res.unwrap();
    assert.ok(Array.isArray(val.data));
    assert.equal(val.data[0].filename, "a.pdf");
    assert.equal(val.total, 1);
});
