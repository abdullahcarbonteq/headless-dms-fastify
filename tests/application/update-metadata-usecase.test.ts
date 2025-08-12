import test from "node:test";
import { strict as assert } from "node:assert";
import { Result } from "@carbonteq/fp";

import { UpdateDocumentMetadataUseCase } from "../../src/application/use-cases/document/UpdateDocumentMetadataUseCase.js";
import type { DocumentRepositoryPort } from "../../src/application/ports/DocumentRepositoryPort.js";
import type { ILogger } from "../../src/shared/interfaces/ILogger.js";
import { DocumentFactory } from "../../src/domain/entities/document/DocumentFactory.js";

function logger(): ILogger {
  return { debug() {}, info() {}, warn() {}, error() {}, child() { return this; } } as unknown as ILogger;
}

test("UpdateDocumentMetadataUseCase: success", async () => {
  const doc = DocumentFactory.createDocument({
    filename: "r.pdf",
    mimetype: "application/pdf",
    path: "/uploads/r.pdf",
    tags: ["a"],
    description: "d",
    userId: "u1",
  }).unwrap();

  let updated: any = null;
  const repo: DocumentRepositoryPort = {
    createDocument: async () => Result.Ok(doc),
    findById: async () => Result.Ok(doc),
    getAllDocuments: async () => Result.Ok([doc]),
    deleteDocument: async () => Result.Ok(true),
    searchDocuments: async () => Result.Ok([doc]),
    updateDocument: async (d) => { updated = d; return Result.Ok(d); },
  };

  const uc = new UpdateDocumentMetadataUseCase(repo, logger());
  const res = await uc.execute({ id: doc.id, tags: ["x", "y"], description: "updated" });
  assert.equal(res.isOk(), true);
  const out = res.unwrap();
  assert.deepEqual(out.tags, ["x", "y"]);
  assert.equal(out.description, "updated");
  assert.ok(updated);
});

test("UpdateDocumentMetadataUseCase: invalid tags (too many)", async () => {
  const doc = DocumentFactory.createDocument({
    filename: "r.pdf",
    mimetype: "application/pdf",
    path: "/uploads/r.pdf",
    tags: ["a"],
    description: "d",
    userId: "u1",
  }).unwrap();

  const many = Array.from({ length: 60 }).map((_, i) => `t${i}`);

  const repo: DocumentRepositoryPort = {
    createDocument: async () => Result.Ok(doc),
    findById: async () => Result.Ok(doc),
    getAllDocuments: async () => Result.Ok([doc]),
    deleteDocument: async () => Result.Ok(true),
    searchDocuments: async () => Result.Ok([doc]),
    updateDocument: async (d) => Result.Ok(d),
  };

  const uc = new UpdateDocumentMetadataUseCase(repo, logger());
  const res = await uc.execute({ id: doc.id, tags: many });
  assert.equal(res.isErr(), true);
});
