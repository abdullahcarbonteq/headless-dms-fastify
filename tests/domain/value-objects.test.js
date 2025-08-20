import { strict as assert } from "node:assert";
import test from "node:test";
import { EmailAddress } from "../../src/domain/value-objects/EmailAddress.js";
import { UserName } from "../../src/domain/value-objects/UserName.js";
import { PasswordHash } from "../../src/domain/value-objects/PasswordHash.js";
import { FileName } from "../../src/domain/value-objects/FileName.js";
import { MimeType } from "../../src/domain/value-objects/MimeType.js";
import { TagList } from "../../src/domain/value-objects/TagList.js";
import { Description } from "../../src/domain/value-objects/Description.js";
import { PathVO } from "../../src/domain/value-objects/PathVO.js";
test("EmailAddress.create normalizes/lowercases", () => {
    const r = EmailAddress.create("User@Example.com");
    assert.equal(r.isOk(), true);
    assert.equal(r.unwrap().value, "user@example.com");
});
test("UserName.create rejects short", () => {
    const r = UserName.create("a");
    assert.equal(r.isErr(), true);
});
test("PasswordHash.create rejects short", () => {
    const r = PasswordHash.create("short");
    assert.equal(r.isErr(), true);
});
test("FileName ok", () => {
    const r = FileName.create("report.pdf");
    assert.equal(r.isOk(), true);
});
test("MimeType ok", () => {
    const r = MimeType.create("application/pdf");
    assert.equal(r.isOk(), true);
});
test("TagList dedupes and trims", () => {
    const r = TagList.create([" alpha ", "alpha", "beta"]);
    assert.equal(r.isOk(), true);
    assert.deepEqual(r.unwrap().values, ["alpha", "beta"]);
});
test("Description bounded length", () => {
    const r = Description.create("ok");
    assert.equal(r.isOk(), true);
});
test("PathVO ok", () => {
    const r = PathVO.create("/uploads/x.txt");
    assert.equal(r.isOk(), true);
});
