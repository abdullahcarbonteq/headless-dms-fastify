import test from "node:test";
import { strict as assert } from "node:assert";
import { Result } from "@carbonteq/fp";

import { UploadDocumentUseCase } from "../../src/application/use-cases/document/UploadDocumentUseCase.js";
import type { DocumentRepositoryPort } from "../../src/application/ports/DocumentRepositoryPort.js";
import type { ILogger } from "../../src/shared/interfaces/ILogger.js";

function makeLogger(): ILogger {
  return {
    debug() {}, info() {}, warn() {}, error() {},
    child() { return this; }
  } as unknown as ILogger;
}

test("UploadDocumentUseCase: success", async () => {
  let created: any = null;

  const repo = {
    createDocument: async (doc: any) => {
      created = doc;
      return Result.Ok(doc);
    },
  } as unknown as DocumentRepositoryPort;

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
