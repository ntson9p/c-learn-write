/**
 * Device text-to-speech (Web Speech API). Only Mandarin voices are used
 * (zh-CN first, then zh-TW / zh-SG / plain zh); Cantonese voices (zh-HK,
 * yue) are skipped. When no voice fits, the app hides its speaker buttons.
 */
import { signal } from '@preact/signals';

export interface VoiceInfo {
  name: string;
  lang: string;
  voiceURI: string;
  localService: boolean;
}

/** Mandarin voices available on this device, best first. */
export const voices = signal<VoiceInfo[]>([]);

function rank(lang: string): number {
  const l = lang.toLowerCase().replace('_', '-');
  if (l.startsWith('zh-hk') || l.startsWith('yue') || l.includes('yue')) return -1;
  if (l === 'zh-cn' || l.startsWith('zh-hans') || l.startsWith('cmn')) return 3;
  if (l === 'zh-tw' || l === 'zh-sg' || l.startsWith('zh-hant')) return 2;
  if (l === 'zh' || l.startsWith('zh-')) return 1;
  return -1;
}

/** Keeps Mandarin voices, best first (zh-CN, local voices first). */
export function mandarinVoices(all: readonly VoiceInfo[]): VoiceInfo[] {
  return all
    .filter((v) => rank(v.lang) > 0)
    .sort((a, b) => rank(b.lang) - rank(a.lang) || Number(b.localService) - Number(a.localService) || a.name.localeCompare(b.name));
}

/** The preferred voice when available, else the best one. */
export function pickVoice(list: readonly VoiceInfo[], preferredURI: string | null): VoiceInfo | null {
  return list.find((v) => v.voiceURI === preferredURI) ?? list[0] ?? null;
}

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
}

function refresh(): void {
  const s = synth();
  if (!s) return;
  voices.value = mandarinVoices(
    s.getVoices().map((v) => ({ name: v.name, lang: v.lang, voiceURI: v.voiceURI, localService: v.localService })),
  );
}

/** Starts watching the voice list (Chrome fills it asynchronously). */
export function initSpeech(): void {
  const s = synth();
  if (!s) return;
  refresh();
  s.addEventListener?.('voiceschanged', refresh);
}

/** Reads Chinese text aloud. Returns false when no Mandarin voice exists. */
export function speak(text: string, opts: { rate: number; voiceURI: string | null }): boolean {
  const s = synth();
  const info = pickVoice(voices.value, opts.voiceURI);
  if (!s || !info) return false;
  const voice = s.getVoices().find((v) => v.voiceURI === info.voiceURI);
  const u = new SpeechSynthesisUtterance(text);
  u.lang = info.lang;
  if (voice) u.voice = voice;
  u.rate = opts.rate;
  s.cancel();
  s.speak(u);
  return true;
}
