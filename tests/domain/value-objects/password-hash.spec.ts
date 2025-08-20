import { expect } from 'chai';
import { PasswordHash } from '../../../src/domain/value-objects/PasswordHash.js';

describe('PasswordHash VO', () => {
  it('accepts sufficiently long hashes', () => {
    const res = PasswordHash.create('$2b$10$abcdefghijklmnopqrstuv');
    expect(res.isOk()).to.equal(true);
  });

  it('rejects too short hashes', () => {
    const res = PasswordHash.create('short');
    expect(res.isErr()).to.equal(true);
  });
});

