import test from "node:test";
import { strict as assert } from "node:assert";
import { Result } from "@carbonteq/fp";

import { GenerateDownloadLinkUseCase } from "../../src/application/use-cases/document/GenerateDownloadLinkUseCase.js";
import type { DocumentRepositoryPort } from "../../src/application/ports/DocumentRepositoryPort.js";
import type { AuthPort } from "../../src/application/ports/AuthPort.js";
import type { ILogger } from "../../src/shared/interfaces/ILogger.js";
import { DocumentFactory } from "../../src/domain/entities/document/DocumentFactory.js";

function logger(): ILogger {
  return { debug() {}, info() {}, warn() {}, error() {}, child() { return this; } } as unknown as ILogger;
}

test("GenerateDownloadLinkUseCase: success", async () => {
  const doc = DocumentFactory.createDocument({
    filename: "r.pdf",
    mimetype: "application/pdf",
    path: "/uploads/r.pdf",
    userId: "u1",
  }).unwrap();

  const repo: DocumentRepositoryPort = {
    createDocument: async () => Result.Ok(doc),
    findById: async () => Result.Ok(doc),
    getAllDocuments: async () => Result.Ok([doc]),
    deleteDocument: async () => Result.Ok(true),
    searchDocuments: async () => Result.Ok([doc]),
    updateDocument: async (d) => Result.Ok(d),
  };

  const auth: AuthPort = {
    hashPassword: async () => Result.Ok("irrelevant"),
    comparePassword: async () => Result.Ok(true),
    generateToken: async () => Result.Ok("irrelevant"),
    verifyToken: async () => Result.Ok({ userId: "u1", role: "user", email: "u@e.com" }),
    generateDownloadToken: async () => Result.Ok("dl-token-abc"),
    verifyDownloadToken: async () => Result.Ok({ docId: "d1" }),
  };

  const uc = new GenerateDownloadLinkUseCase(repo, auth, logger());
  const res = await uc.execute({ id: doc.id });
  assert.equal(res.isOk(), true);
  assert.ok(res.unwrap().url.includes("/api/documents/download/"));
});

test("GenerateDownloadLinkUseCase: not found", async () => {
  const repo: DocumentRepositoryPort = {
    createDocument: async () => Result.Ok(null as any),
    findById: async () => Result.Ok(null),
    getAllDocuments: async () => Result.Ok([]),
    deleteDocument: async () => Result.Ok(false),
    searchDocuments: async () => Result.Ok([]),
    updateDocument: async (d) => Result.Ok(d),
  };

  const auth: AuthPort = {
    hashPassword: async () => Result.Ok("irrelevant"),
    comparePassword: async () => Result.Ok(true),
    generateToken: async () => Result.Ok("irrelevant"),
    verifyToken: async () => Result.Ok({ userId: "u1", role: "user", email: "u@e.com" }),
    generateDownloadToken: async () => Result.Ok("dl-token-abc"),
    verifyDownloadToken: async () => Result.Ok({ docId: "d1" }),
  };

  const uc = new GenerateDownloadLinkUseCase(repo, auth, logger());
  const res = await uc.execute({ id: "missing" });
  assert.equal(res.isErr(), true);
});
