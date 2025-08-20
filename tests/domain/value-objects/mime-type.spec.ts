import { expect } from 'chai';
import { MimeType } from '../../../src/domain/value-objects/MimeType.js';

describe('MimeType VO', () => {
  it('accepts common types', () => {
    for (const mt of ['application/pdf', 'text/plain', 'image/png', 'image/jpeg']) {
      const res = MimeType.create(mt);
      expect(res.isOk(), mt).to.equal(true);
      expect(res.unwrap().value).to.equal(mt);
    }
  });

  it('accepts general families', () => {
    for (const mt of ['application/zip', 'image/gif', 'text/markdown']) {
      const res = MimeType.create(mt);
      expect(res.isOk(), mt).to.equal(true);
    }
  });

  it('rejects invalid formats', () => {
    for (const mt of ['invalid', 'text', '/plain', 'textplain']) {
      const res = MimeType.create(mt as any);
      expect(res.isErr(), mt).to.equal(true);
    }
  });
});

