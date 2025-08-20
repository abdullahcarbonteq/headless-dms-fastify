import { expect } from 'chai';
import { FileName } from '../../../src/domain/value-objects/FileName.js';

describe('Filename VO', () => {
    it('accepts valid filenames', () => {
        const res = FileName.create('text.txt');
        expect(res.isOk()).to.equal(true);
        expect(res.unwrap().value).to.equal('text.txt');
    });

    it('rejects empty filenames', () => {
        const res = FileName.create('   ');
        expect(res.isErr()).to.equal(true);
    });

    it('rejects too long filenames', () => {
        const long = 'a'.repeat(256);
        const res = FileName.create(long);
        expect(res.isErr()).to.equal(true);
    });
});