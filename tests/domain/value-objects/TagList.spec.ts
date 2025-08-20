import { expect } from 'chai';
import {TagList} from '../../../src/domain/value-objects/TagList.js'

describe('TagList VO', () => {
    it('accepts valid tags', () => {
        const res = TagList.create(['tag1', 'tag2', 'tag3']);
        expect(res.isOk()).to.equal(true);
        expect(res.unwrap().values).to.deep.equal(['tag1', 'tag2', 'tag3'])
    })

    it('rejects too many tags', () => {
        const tags = Array.from({length: 51}, (_, i) => `t${i}`);
        const res = TagList.create(tags);
        expect(res.isErr()).to.equal(true);
    })

    it('rejects a tag that is too long', () => {
        const res = TagList.create(['supercalifragilisticexpalidociousthisstillisntlongenoughforaninvalidtagisit']);
        expect(res.isErr()).to.equal(true);
    })

    it('dedupes and trims tags', () => {
        const res = TagList.create(['  a ', 'a', 'b', ' b ']);
        expect(res.isOk()).to.equal(true);
        expect(res.unwrap().values).to.deep.equal(['a', 'b']);
    })
})