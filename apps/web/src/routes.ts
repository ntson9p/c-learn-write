import type { PageLoader } from './components/lazy';
import type { Tab } from './components/nav';
import { matchRoute, type Params } from './router';

export interface RouteDef {
  pattern: string;
  /** Highlighted bottom-navigation tab. */
  tab: Tab | null;
  load: PageLoader;
}

export const ROUTES: readonly RouteDef[] = [
  { pattern: '/', tab: 'learn', load: () => import('./pages/home') },
  { pattern: '/lesson/:id', tab: 'learn', load: () => import('./pages/lesson') },
  { pattern: '/word/:no', tab: 'dict', load: () => import('./pages/word') },
  { pattern: '/grammar/:no', tab: 'learn', load: () => import('./pages/grammar') },
  { pattern: '/practice/:id', tab: 'learn', load: () => import('./pages/practice') },
  { pattern: '/quiz/:id', tab: 'learn', load: () => import('./pages/quiz') },
  { pattern: '/test/:level', tab: 'progress', load: () => import('./pages/level-test') },
  { pattern: '/guide', tab: 'settings', load: () => import('./pages/guide') },
  { pattern: '/write', tab: 'learn', load: () => import('./pages/write') },
  { pattern: '/write/:char', tab: 'learn', load: () => import('./pages/write') },
  { pattern: '/review', tab: 'review', load: () => import('./pages/review') },
  { pattern: '/dict', tab: 'dict', load: () => import('./pages/dictionary') },
  { pattern: '/progress', tab: 'progress', load: () => import('./pages/progress') },
  { pattern: '/settings', tab: 'settings', load: () => import('./pages/settings') },
  { pattern: '/grader', tab: 'settings', load: () => import('./pages/grader') },
  { pattern: '/about', tab: 'settings', load: () => import('./pages/about') },
];

export function resolveRoute(path: string): { route: RouteDef; params: Params } | null {
  for (const route of ROUTES) {
    const params = matchRoute(route.pattern, path);
    if (params) return { route, params };
  }
  return null;
}
