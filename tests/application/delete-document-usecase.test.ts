import test from "node:test";
import { strict as assert } from "node:assert";
import { Result } from "@carbonteq/fp";

import { DeleteDocumentUseCase } from "../../src/application/use-cases/document/DeleteDocumentUseCase.js";
import type { DocumentRepositoryPort } from "../../src/application/ports/DocumentRepositoryPort.js";
import type { ILogger } from "../../src/shared/interfaces/ILogger.js";

function logger(): ILogger {
  return { debug() {}, info() {}, warn() {}, error() {}, child() { return this; } } as unknown as ILogger;
}

test("DeleteDocumentUseCase: success true", async () => {
  const repo: DocumentRepositoryPort = {
    createDocument: async (x) => Result.Ok(x),
    findById: async () => Result.Ok(null as any),
    getAllDocuments: async () => Result.Ok([]),
    deleteDocument: async () => Result.Ok(true),
    searchDocuments: async () => Result.Ok([]),
    updateDocument: async (x) => Result.Ok(x),
  };

  const uc = new DeleteDocumentUseCase(repo, logger());
  const res = await uc.execute({ id: "d1" });
  assert.equal(res.isOk(), true);
  assert.equal(res.unwrap(), true);
});

test("DeleteDocumentUseCase: repo error", async () => {
  const repo: DocumentRepositoryPort = {
    createDocument: async (x) => Result.Ok(x),
    findById: async () => Result.Ok(null as any),
    getAllDocuments: async () => Result.Ok([]),
    deleteDocument: async () => Result.Err(new Error("db")),
    searchDocuments: async () => Result.Ok([]),
    updateDocument: async (x) => Result.Ok(x),
  };

  const uc = new DeleteDocumentUseCase(repo, logger());
  const res = await uc.execute({ id: "d1" });
  assert.equal(res.isErr(), true);
});

