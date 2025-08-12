import test from "node:test";
import { strict as assert } from "node:assert";
import { Result } from "@carbonteq/fp";

import { GetDocumentByIdUseCase } from "../../src/application/use-cases/document/GetDocumentByIdUseCase.js";
import type { DocumentRepositoryPort } from "../../src/application/ports/DocumentRepositoryPort.js";
import type { ILogger } from "../../src/shared/interfaces/ILogger.js";
import { DocumentFactory } from "../../src/domain/entities/document/DocumentFactory.js";

function logger(): ILogger {
  return { debug() {}, info() {}, warn() {}, error() {}, child() { return this; } } as unknown as ILogger;
}

test("GetDocumentByIdUseCase: found", async () => {
  const d = DocumentFactory.createDocument({
    filename: "a.pdf",
    mimetype: "application/pdf",
    path: "/uploads/a.pdf",
    tags: ["t1"],
    description: "desc",
    userId: "u1",
  }).unwrap();

  const repo: DocumentRepositoryPort = {
    createDocument: async (x) => Result.Ok(x),
    findById: async () => Result.Ok(d),
    getAllDocuments: async () => Result.Ok([d]),
    deleteDocument: async () => Result.Ok(true),
    searchDocuments: async () => Result.Ok([d]),
    updateDocument: async (x) => Result.Ok(x),
  };

  const uc = new GetDocumentByIdUseCase(repo, logger());
  const res = await uc.execute(d.id);
  assert.equal(res.isOk(), true);
  const out = res.unwrap();
  assert.ok(out);
  assert.equal(out?.id, d.id);
});

test("GetDocumentByIdUseCase: not found (null)", async () => {
  const repo: DocumentRepositoryPort = {
    createDocument: async (x) => Result.Ok(x),
    findById: async () => Result.Ok(null),
    getAllDocuments: async () => Result.Ok([]),
    deleteDocument: async () => Result.Ok(true),
    searchDocuments: async () => Result.Ok([]),
    updateDocument: async (x) => Result.Ok(x),
  };

  const uc = new GetDocumentByIdUseCase(repo, logger());
  const res = await uc.execute("missing");
  assert.equal(res.isOk(), true);
  assert.equal(res.unwrap(), null);
});

test("GetDocumentByIdUseCase: repo error", async () => {
  const repo: DocumentRepositoryPort = {
    createDocument: async (x) => Result.Ok(x),
    findById: async () => Result.Err(new Error("db")),
    getAllDocuments: async () => Result.Ok([]),
    deleteDocument: async () => Result.Ok(true),
    searchDocuments: async () => Result.Ok([]),
    updateDocument: async (x) => Result.Ok(x),
  };

  const uc = new GetDocumentByIdUseCase(repo, logger());
  const res = await uc.execute("missing");
  assert.equal(res.isErr(), true);
});

