import type { DeckConfig, Round, Rules, Session } from './types';
import { cryptoId, defaultSchedule, makeEntry } from './rules';

const KEY = 'os-pirata.sessions.v1';

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== 'object') return false;
  const s = value as Partial<Session>;
  return (
    typeof s.id === 'string' &&
    typeof s.title === 'string' &&
    Array.isArray(s.players) &&
    Array.isArray(s.rounds) &&
    Array.isArray(s.schedule) &&
    typeof s.rules === 'object' &&
    typeof s.deck === 'object'
  );
}

export function readSessions(): Session[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSession).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function writeSessions(sessions: Session[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(sessions));
  } catch {
    /* storage full or blocked — the session lives in memory for this visit */
  }
}

export function createSession(input: {
  title: string;
  players: string[];
  rules: Rules;
  deck: DeckConfig;
  schedule: number[] | null;
}): Session {
  const players = input.players.map((name, index) => ({
    id: `p${index + 1}-${cryptoId().slice(0, 6)}`,
    name: name.trim(),
  }));
  const schedule = input.schedule ?? defaultSchedule(10, players.length, input.deck);
  return {
    id: cryptoId(),
    title: input.title.trim() || 'Untitled voyage',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'live',
    players,
    rules: { ...input.rules },
    deck: { ...input.deck },
    schedule,
    rounds: [],
    gameOverrides: {},
  };
}

export function buildRound(session: Session, index: number): Round {
  const cards = session.schedule[index] ?? session.schedule[session.schedule.length - 1] ?? 1;
  const entries: Record<string, ReturnType<typeof makeEntry>> = {};
  for (const player of session.players) entries[player.id] = makeEntry();
  return { id: cryptoId(), cards, entries, overrides: {}, note: '' };
}

export function exportSession(session: Session): string {
  return JSON.stringify(session, null, 2);
}

export function downloadJson(session: Session): void {
  const blob = new Blob([exportSession(session)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `os-pirata-${session.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
