import type {
  BonusKey,
  DeckConfig,
  PlayerEntry,
  PlayerScore,
  Round,
  RoundScore,
  Rules,
  Session,
} from './types';

export const BONUS_META: Record<
  BonusKey,
  { label: string; points: number; group: string; needs: 'base' | keyof DeckConfig; hint: string }
> = {
  fourteen: {
    label: '14 of colour',
    points: 10,
    group: 'Treasure',
    needs: 'base',
    hint: '10 each, any colour 14 taken with the trick',
  },
  fourteenBlack: {
    label: 'Black 14',
    points: 20,
    group: 'Treasure',
    needs: 'base',
    hint: '20 for the trump 14',
  },
  eightCaptured: {
    label: '8 captured',
    points: 5,
    group: 'Expansion',
    needs: 'expansionNumbers',
    hint: '+5 each, only with the expansion number cards',
  },
  sevenCaptured: {
    label: '7 captured',
    points: -5,
    group: 'Expansion',
    needs: 'expansionNumbers',
    hint: '−5 each, the expansion 7s sting',
  },
  mermaidByPirate: {
    label: 'Mermaid by pirate',
    points: 20,
    group: 'Characters',
    needs: 'base',
    hint: '20 per mermaid a pirate captures',
  },
  pirateBySkullKing: {
    label: 'Pirate by Skull King',
    points: 30,
    group: 'Characters',
    needs: 'base',
    hint: '30 per pirate the Skull King takes',
  },
  skullKingByMermaid: {
    label: 'Skull King by mermaid',
    points: 40,
    group: 'Characters',
    needs: 'base',
    hint: '40 for the captain taken by a mermaid',
  },
  firstMateTaken: {
    label: 'First mate taken',
    points: 30,
    group: 'Characters',
    needs: 'firstMateCon',
    hint: '30 when the Skull King or a mermaid takes the first mate',
  },
  davyMonsters: {
    label: 'Monster by Davy',
    points: 20,
    group: 'Expansion',
    needs: 'davyJones',
    hint: "20 per sea monster Davy Jones' Locker destroys",
  },
  lootAlliance: {
    label: 'Loot alliance',
    points: 20,
    group: 'Alliances',
    needs: 'loot',
    hint: '20 each when both allies make their bid',
  },
};

export const BONUS_ORDER: BonusKey[] = [
  'fourteen',
  'fourteenBlack',
  'eightCaptured',
  'sevenCaptured',
  'mermaidByPirate',
  'pirateBySkullKing',
  'skullKingByMermaid',
  'firstMateTaken',
  'davyMonsters',
  'lootAlliance',
];

export const DEFAULT_DECK: DeckConfig = {
  expansionNumbers: false,
  wild15: false,
  maryThorne: false,
  firstMateCon: false,
  lastVolley: false,
  stingray: false,
  davyJones: false,
  walkThePlank: false,
  kraken: false,
  whiteWhale: false,
  loot: false,
};

export const FULL_DECK: DeckConfig = {
  expansionNumbers: true,
  wild15: true,
  maryThorne: true,
  firstMateCon: true,
  lastVolley: true,
  stingray: true,
  davyJones: true,
  walkThePlank: true,
  kraken: true,
  whiteWhale: true,
  loot: true,
};

export const DECK_ITEMS: { key: keyof DeckConfig; name: string; note: string }[] = [
  { key: 'expansionNumbers', name: 'Extra 7s, 8s & 0/14s', note: '12 more number cards' },
  { key: 'wild15', name: 'Wild monkey 15', note: 'Wild suit, never trump' },
  { key: 'maryThorne', name: 'Mary Thorne', note: 'Sixth pirate' },
  { key: 'firstMateCon', name: 'First mate', note: 'Beats pirates, loses to captain' },
  { key: 'kraken', name: 'Kraken', note: 'Destroys the whole trick' },
  { key: 'whiteWhale', name: 'White whale', note: 'Numbered cards lose their suit' },
  { key: 'stingray', name: 'Spotted stingray', note: 'Lowest number wins' },
  { key: 'davyJones', name: 'Davy Jones’ locker', note: 'Kills monsters, +20 each' },
  { key: 'walkThePlank', name: 'Walk the plank', note: 'Removes a pirate' },
  { key: 'lastVolley', name: 'Last volley', note: 'Extra card, skip final trick' },
  { key: 'loot', name: 'Loot', note: 'Alliances worth 20' },
];

export const DEFAULT_RULES: Rules = {
  scoring: 'standard',
  bonuses: true,
  bonusRequiresBid: true,
  pirateAbilities: true,
  rascalCannons: false,
};

export type RoundPreset = {
  key: string;
  name: string;
  note: string;
  cards: number[] | null;
};

export const ROUND_PRESETS: RoundPreset[] = [
  { key: 'classic', name: 'Classic', note: '1 to 10 cards, ten rounds', cards: null },
  { key: 'even', name: 'Even keeled', note: '2 · 4 · 6 · 8 · 10', cards: [2, 4, 6, 8, 10] },
  { key: 'brawl', name: 'Skip to the brawl', note: '6 · 7 · 8 · 9 · 10', cards: [6, 7, 8, 9, 10] },
  { key: 'swift', name: 'Swift-n-salty', note: 'Five rounds of 5', cards: [5, 5, 5, 5, 5] },
  { key: 'broadside', name: 'Broadside barrage', note: 'Ten rounds of 10', cards: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10] },
  {
    key: 'whirlpool',
    name: 'Whirlpool',
    note: '9 · 7 · 5 · 3 · 1 twice',
    cards: [9, 7, 5, 3, 1, 9, 7, 5, 3, 1],
  },
  { key: 'bedtime', name: 'Past your bedtime', note: 'One round of 1', cards: [1] },
];

export function deckSize(deck: DeckConfig): number {
  // 56 numbered cards + 14 base specials, then the optional additions.
  let size = 70;
  if (deck.expansionNumbers) size += 12;
  if (deck.wild15) size += 1;
  if (deck.maryThorne) size += 1;
  if (deck.firstMateCon) size += 1;
  if (deck.lastVolley) size += 1;
  if (deck.stingray) size += 1;
  if (deck.davyJones) size += 1;
  if (deck.walkThePlank) size += 3;
  if (deck.kraken) size += 1;
  if (deck.whiteWhale) size += 1;
  if (deck.loot) size += 2;
  return size;
}

export function maxCardsFor(players: number, deck: DeckConfig): number {
  return Math.max(1, Math.min(10, Math.floor(deckSize(deck) / Math.max(1, players))));
}

export function defaultSchedule(rounds: number, players: number, deck: DeckConfig): number[] {
  const ceiling = maxCardsFor(players, deck);
  return Array.from({ length: rounds }, (_, i) => Math.min(i + 1, ceiling));
}

export function makeEntry(): PlayerEntry {
  return { bid: 0, tricks: 0, bonuses: {}, wager: 0, cannon: 'grapeshot' };
}

export function cryptoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function bonusMultiplier(entry: PlayerEntry, rules: Rules): number {
  if (!rules.bonusRequiresBid) return 1;
  const exact = entry.bid === entry.tricks;
  if (rules.scoring === 'rascal') {
    if (entry.cannon === 'cannonball' && rules.rascalCannons) return exact ? 1 : 0;
    const off = Math.abs(entry.bid - entry.tricks);
    if (off === 0) return 1;
    if (off === 1) return 0.5;
    return 0;
  }
  return exact ? 1 : 0;
}

export function scoreEntry(entry: PlayerEntry, cards: number, rules: Rules): PlayerScore {
  let bidPoints = 0;
  if (rules.scoring === 'rascal') {
    const potential = 10 * cards;
    if (rules.rascalCannons && entry.cannon === 'cannonball') {
      bidPoints = entry.bid === entry.tricks ? 15 * cards : 0;
    } else {
      const off = Math.abs(entry.bid - entry.tricks);
      if (off === 0) bidPoints = potential;
      else if (off === 1) bidPoints = Math.floor(potential / 2);
      else bidPoints = 0;
    }
  } else if (entry.bid === 0) {
    bidPoints = entry.tricks === 0 ? 10 * cards : -10 * cards;
  } else if (entry.bid === entry.tricks) {
    bidPoints = 20 * entry.bid;
  } else {
    bidPoints = -10 * Math.abs(entry.bid - entry.tricks);
  }

  let rawBonus = 0;
  for (const key of BONUS_ORDER) {
    const count = entry.bonuses[key] ?? 0;
    if (count) rawBonus += count * BONUS_META[key].points;
  }
  const multiplier = bonusMultiplier(entry, rules);
  const bonusPoints = Math.floor(rawBonus * multiplier);

  const wagerPoints = entry.wager ? (entry.bid === entry.tricks ? entry.wager : -entry.wager) : 0;

  const computed = bidPoints + bonusPoints + wagerPoints;

  return {
    playerId: '',
    bidPoints,
    bonusPoints,
    wagerPoints,
    computed,
    override: null,
    total: computed,
    bonusesIgnored: rawBonus !== 0 && multiplier === 0,
  };
}

export function scoreRound(round: Round, rules: Rules): RoundScore {
  const perPlayer: Record<string, PlayerScore> = {};
  let total = 0;
  for (const [playerId, entry] of Object.entries(round.entries)) {
    const score = scoreEntry(entry, round.cards, rules);
    const override = round.overrides[playerId];
    const hasOverride = typeof override === 'number' && Number.isFinite(override);
    const scored: PlayerScore = {
      ...score,
      playerId,
      override: hasOverride ? override : null,
      total: hasOverride ? override : score.computed,
    };
    perPlayer[playerId] = scored;
    total += scored.total;
  }
  return { perPlayer, total };
}

export type Standings = {
  playerId: string;
  name: string;
  total: number;
  rounds: number[];
  adjustment: number;
};

export function standings(session: Session): Standings[] {
  const rows: Standings[] = session.players.map((p) => ({
    playerId: p.id,
    name: p.name,
    total: 0,
    rounds: [],
    adjustment: session.gameOverrides[p.id] ?? 0,
  }));
  for (const round of session.rounds) {
    const scored = scoreRound(round, session.rules);
    for (const row of rows) {
      const s = scored.perPlayer[row.playerId];
      const value = s ? s.total : 0;
      row.total += value;
      row.rounds.push(value);
    }
  }
  for (const row of rows) row.total += row.adjustment;
  return rows.sort((a, b) => b.total - a.total);
}

/** Who leads a given round: the first leader, then clockwise round by round. */
export function roundLeader(session: Session, roundIndex: number): Session['players'][number] | undefined {
  const { players } = session;
  if (players.length === 0) return undefined;
  const start = Math.max(0, players.findIndex((player) => player.id === session.firstLeaderId));
  return players[(start + roundIndex) % players.length];
}

export function roundsTotal(session: Session): number {
  return session.schedule.length;
}

export function isSessionComplete(session: Session): boolean {
  return session.status === 'done' || session.rounds.length >= session.schedule.length;
}
