import test from "node:test";
import { strict as assert } from "node:assert";
import { Result } from "@carbonteq/fp";

import { SearchDocumentsUseCase } from "../../src/application/use-cases/document/SearchDocumentsUseCase.js";
import type { DocumentRepositoryPort, PaginatedResult } from "../../src/application/ports/DocumentRepositoryPort.js";
import type { ILogger } from "../../src/shared/interfaces/ILogger.js";
import { DocumentFactory } from "../../src/domain/entities/document/DocumentFactory.js";

function logger(): ILogger {
  return { debug() {}, info() {}, warn() {}, error() {}, child() { return this; } } as unknown as ILogger;
}

test("SearchDocumentsUseCase: array result", async () => {
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

  const uc = new SearchDocumentsUseCase(repo, logger());
  const res = await uc.execute({ tags: ["t1"], page: undefined, limit: undefined });
  assert.equal(res.isOk(), true);
  const val = res.unwrap();
  assert.ok(Array.isArray(val));
  assert.equal(val[0].filename, "a.pdf");
});

test("SearchDocumentsUseCase: paginated result", async () => {
  const d = DocumentFactory.createDocument({
    filename: "a.pdf",
    mimetype: "application/pdf",
    path: "/uploads/a.pdf",
    tags: ["t1"],
    description: "desc",
    userId: "u1",
  }).unwrap();

  const page: PaginatedResult<typeof d> = {
    data: [d],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  } as any;

  const repo: DocumentRepositoryPort = {
    createDocument: async (x) => Result.Ok(x),
    findById: async () => Result.Ok(d),
    getAllDocuments: async () => Result.Ok([d]),
    deleteDocument: async () => Result.Ok(true),
    searchDocuments: async () => Result.Ok(page as any),
    updateDocument: async (x) => Result.Ok(x),
  };

  const uc = new SearchDocumentsUseCase(repo, logger());
  const res = await uc.execute({ tags: ["t1"], page: 1, limit: 10 });
  assert.equal(res.isOk(), true);
  const val = res.unwrap() as any;
  assert.ok(Array.isArray(val.data));
  assert.equal(val.data[0].filename, "a.pdf");
  assert.equal(val.total, 1);
});

