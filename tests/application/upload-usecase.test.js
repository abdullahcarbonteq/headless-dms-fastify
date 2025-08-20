import test from "node:test";
import { strict as assert } from "node:assert";
import { Result } from "@carbonteq/fp";
import { UploadDocumentUseCase } from "../../src/application/use-cases/document/UploadDocumentUseCase.js";
function makeLogger() {
    return {
        debug() { }, info() { }, warn() { }, error() { },
        child() { return this; }
    };
}
test("UploadDocumentUseCase: success", async () => {
    let created = null;
    const repo = {
        createDocument: async (doc) => {
            created = doc;
            return Result.Ok(doc);
        },
    };
    const uc = new UploadDocumentUseCase(repo, makeLogger());
    const out = await uc.execute({
        filename: "report.pdf",
        mimetype: "application/pdf",
        path: "/uploads/report.pdf",
        tags: ["alpha", "beta"],
        description: "desc",
        userId: "user-1",
    });
    assert.equal(out.isOk(), true);
    const dto = out.unwrap();
    assert.equal(dto.filename, "report.pdf");
    assert.equal(dto.mimetype, "application/pdf");
    assert.equal(dto.path, "/uploads/report.pdf");
    assert.deepEqual(dto.tags, ["alpha", "beta"]);
    assert.equal(dto.userId, "user-1");
    assert.ok(created); // repository was called
});
