import {expect} from 'chai';
import {Description} from '../../../src/domain/value-objects/Description.js'

describe('Description VO', () => {
    it('accepts valid descriptions', () => {
        const res = Description.create('This is a valid description');
        expect(res.isOk()).to.equal(true);
        expect(res.unwrap().value).to.equal('This is a valid description');
    })

    it('accepts null description', () => {
        const res = Description.create(null);
        expect(res.isOk()).to.equal(true);
        expect(res.unwrap().value).to.equal(null);
    })

    it('rejects too long descriptions', () => {
        const res = Description.create('a'.repeat(1001));
        expect(res.isErr()).to.equal(true);
    })
})