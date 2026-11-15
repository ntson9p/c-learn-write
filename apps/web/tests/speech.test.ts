import { describe, expect, it } from 'vitest';
import { mandarinVoices, pickVoice, type VoiceInfo } from '../src/lib/speech';

const v = (name: string, lang: string, localService = true): VoiceInfo => ({ name, lang, voiceURI: name, localService });

describe('speech voices', () => {
  const all = [
    v('Google 粤語', 'zh-HK'),
    v('Tingting', 'zh-CN', true),
    v('Google 普通话', 'zh-CN', false),
    v('Meijia', 'zh-TW'),
    v('Samantha', 'en-US'),
    v('Linh', 'vi-VN'),
    v('Sinji', 'yue-HK'),
  ];

  it('keeps Mandarin voices only, zh-CN and local ones first', () => {
    expect(mandarinVoices(all).map((x) => x.name)).toEqual(['Tingting', 'Google 普通话', 'Meijia']);
  });

  it('uses the preferred voice when it exists', () => {
    const list = mandarinVoices(all);
    expect(pickVoice(list, 'Meijia')?.name).toBe('Meijia');
    expect(pickVoice(list, 'Gone')?.name).toBe('Tingting');
    expect(pickVoice([], null)).toBeNull();
  });
});
