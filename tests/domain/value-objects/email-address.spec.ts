import { expect } from 'chai';
import { EmailAddress } from '../../../src/domain/value-objects/EmailAddress.js';

describe('EmailAddress VO', () => {
  it('accepts valid emails', () => {
    const res = EmailAddress.create('user@example.com');
    expect(res.isOk()).to.equal(true);
    expect(res.unwrap().value).to.equal('user@example.com');
  });

  it('rejects invalid emails', () => {
    const res = EmailAddress.create('not-an-email');
    expect(res.isErr()).to.equal(true);
  });
});

