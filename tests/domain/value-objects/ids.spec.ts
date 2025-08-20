import { expect } from 'chai';
import { UserId, DocumentId } from '../../../src/domain/value-objects/Ids.js';

describe('Ids VOs', () => {
  it('generates user id if not provided', () => {
    const res = UserId.create();
    expect(res.isOk()).to.equal(true);
    expect(typeof res.unwrap().value).to.equal('string');
  });

  it('accepts provided user id string', () => {
    const res = UserId.create('custom-id');
    expect(res.isOk()).to.equal(true);
    expect(res.unwrap().value).to.equal('custom-id');
  });

  it('generates document id if not provided', () => {
    const res = DocumentId.create();
    expect(res.isOk()).to.equal(true);
    expect(typeof res.unwrap().value).to.equal('string');
  });
});

