export type BonusKey =
  | 'fourteen'
  | 'fourteenBlack'
  | 'mermaidByPirate'
  | 'pirateBySkullKing'
  | 'skullKingByMermaid'
  | 'firstMateTaken'
  | 'eightCaptured'
  | 'sevenCaptured'
  | 'davyMonsters'
  | 'lootAlliance';

export type ScoringMode = 'standard' | 'rascal';

export type DeckConfig = {
  expansionNumbers: boolean;
  wild15: boolean;
  maryThorne: boolean;
  firstMateCon: boolean;
  lastVolley: boolean;
  stingray: boolean;
  davyJones: boolean;
  walkThePlank: boolean;
  kraken: boolean;
  whiteWhale: boolean;
  loot: boolean;
};

export type Rules = {
  scoring: ScoringMode;
  bonuses: boolean;
  bonusRequiresBid: boolean;
  pirateAbilities: boolean;
  rascalCannons: boolean;
};

export type Player = {
  id: string;
  name: string;
};

export type PlayerEntry = {
  bid: number;
  tricks: number;
  bonuses: Partial<Record<BonusKey, number>>;
  wager: number;
  cannon: 'grapeshot' | 'cannonball';
};

export type Round = {
  id: string;
  cards: number;
  entries: Record<string, PlayerEntry>;
  overrides: Record<string, number>;
  note: string;
};

export type Session = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  status: 'live' | 'done';
  players: Player[];
  /** Player id who leads (and deals) the first round; the lead rotates clockwise after that. */
  firstLeaderId: string;
  rules: Rules;
  deck: DeckConfig;
  /** Cards dealt to each player, round by round. Length = number of rounds. */
  schedule: number[];
  rounds: Round[];
  /** Admin adjustment applied to the final total, per player id. */
  gameOverrides: Record<string, number>;
};

export type PlayerScore = {
  playerId: string;
  bidPoints: number;
  bonusPoints: number;
  wagerPoints: number;
  computed: number;
  override: number | null;
  total: number;
  bonusesIgnored: boolean;
};

export type RoundScore = {
  perPlayer: Record<string, PlayerScore>;
  total: number;
};
