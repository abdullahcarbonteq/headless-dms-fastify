import { expect } from 'chai';
import { UserName } from '../../../src/domain/value-objects/UserName.js';

describe('UserName VO', () => {
  it('accepts reasonable names', () => {
    const res = UserName.create('Jane Doe');
    expect(res.isOk()).to.equal(true);
    expect(res.unwrap().value).to.equal('Jane Doe');
  });

  it('rejects very short names', () => {
    const res = UserName.create('A');
    expect(res.isErr()).to.equal(true);
  });
});

