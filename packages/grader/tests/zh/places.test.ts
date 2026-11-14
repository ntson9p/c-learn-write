import { describe, expect, it } from 'vitest';
import { analyzeZh } from '../../src/lang/zh/analyze';
import type { LocationMention } from '../../src/lang/zh/places';

/** unit = "reversed|place|kind|localizer group" */
const show = (m: LocationMention) => ({
  via: m.zai >= 0 ? (m.zaiTypo ? '再' : '在') : (m.verb ?? 'bare'),
  negated: m.negated,
  units: m.phrase.units.map((u) =>
    [u.reversed ? 'R' : '', u.noun?.word ?? '', u.noun?.kind ?? '', u.localizer?.group ?? ''].join('|'),
  ),
});
const mentions = (text: string, expectedPlaces?: string[]) =>
  analyzeZh(text, expectedPlaces ? { expectedPlaces } : {}).locations.map(show);
const units = (text: string) => mentions(text).flatMap((m) => m.units);

describe('location mentions', () => {
  it('reads 在 + place (+ localizer)', () => {
    expect(mentions('我在家吃饭')).toEqual([{ via: '在', negated: false, units: ['|家|place|'] }]);
    expect(units('书在书包里面')).toEqual(['|书包|object|里']);
    expect(units('书在桌子的上面')).toEqual(['|桌子|object|上']);
    expect(units('猫在桌子旁边')).toEqual(['|桌子|object|旁边']);
    expect(units('在里面')).toEqual(['|||里']);
  });

  it('reads compound and nested places', () => {
    expect(units('我在学校的食堂吃饭')).toEqual(['|学校|place|', '|食堂|place|']);
    expect(units('书在桌子上的书包里')).toEqual(['|桌子|object|上', '|书包|object|里']);
    const doc = analyzeZh('我住在越南河内');
    expect(doc.locations[0]?.phrase.units[0]?.noun).toMatchObject({ word: '河内', words: ['越南', '河内'], kind: 'proper' });
  });

  it('reads places after a possessor or a determiner', () => {
    expect(units('我在我的房间吃饭')).toEqual(['|房间|place|']);
    expect(units('我住在一个小城市')).toEqual(['|城市|place|']);
    expect(units('我们在这家饭馆吃饭')).toEqual(['|饭馆|place|']);
  });

  it('recognises a localizer written before the noun', () => {
    expect(units('猫在上桌子')).toEqual(['R|桌子|object|上']);
    expect(units('我在里家')).toEqual(['R|家|place|里']);
  });

  it('does not mistake words for reversed localizers', () => {
    expect(units('我在上海')).toEqual(['|上海|proper|']);
    expect(units('我在家上网')).toEqual(['|家|place|']);
    expect(units('我在车站上车')).toEqual(['|车站|place|']);
    expect(units('我在外地工作')).toEqual(['|外地|unknown|']);
  });

  it('ignores 在 that is not about a place', () => {
    for (const text of ['我在吃饭', '我在上课', '我正在看书', '现在两点', '我实在不知道', '我在晚上吃饭', '我的生日在五月']) {
      expect(mentions(text), text).toEqual([]);
    }
  });

  it('reads 再 typed instead of 在, only before a known place', () => {
    expect(mentions('我再家吃饭')).toEqual([{ via: '再', negated: false, units: ['|家|place|'] }]);
    expect(mentions('再见')).toEqual([]);
    expect(mentions('我再去学校')).toEqual([{ via: '去', negated: false, units: ['|学校|place|'] }]);
  });

  it('detects negation', () => {
    expect(mentions('我不在家吃饭')[0]?.negated).toBe(true);
    expect(mentions('书没在书包里')[0]?.negated).toBe(true);
  });

  it('reads places after verbs that take them directly', () => {
    expect(mentions('我住河内')).toEqual([{ via: '住', negated: false, units: ['|河内|proper|'] }]);
    expect(mentions('我回家吃饭')[0]?.via).toBe('回');
  });

  it('reads bare place answers', () => {
    expect(mentions('书包里。')).toEqual([{ via: 'bare', negated: false, units: ['|书包|object|里'] }]);
    expect(mentions('桌子上有三本书')[0]?.via).toBe('bare');
    expect(mentions('家里')[0]?.units).toEqual(['|家|place|里']);
    expect(mentions('越南人')).toEqual([]);
  });

  it('reads a bare object as a place only for "where" questions', () => {
    expect(mentions('书包')).toEqual([]);
    expect(mentions('一把椅子')).toEqual([]);
    expect(analyzeZh('书包', { locationQuestion: true }).locations).toHaveLength(1);
    expect(analyzeZh('一个书包', { locationQuestion: true }).locations).toHaveLength(0);
  });

  it('accepts names it does not know after 在', () => {
    expect(units('我在阮廌高中学习')).toEqual(['|高中|place|']);
    expect(units('我在阿明家吃饭')).toEqual(['|家|place|']);
    expect(units('我住在阮廌')).toEqual(['|阮廌|unknown|']);
  });

  it('recognises typos of the expected place', () => {
    const typo = analyzeZh('书在书报里', { expectedPlaces: ['书包'] }).locations[0]?.phrase.units[0]?.noun;
    expect(typo).toMatchObject({ word: '书包', typos: [{ index: 3, written: '报', expected: '包' }] });
    const near = analyzeZh('书在书巴里', { expectedPlaces: ['书包'] }).locations[0]?.phrase.units[0]?.noun;
    expect(near).toMatchObject({ kind: 'unknown', text: '书巴', near: '书包' });
  });
});
