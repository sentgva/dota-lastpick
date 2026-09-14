/** Герой из /api/heroStats — базовая сущность всего приложения. */
export interface Hero {
  id: number;
  name: string; // npc_dota_hero_antimage
  localized_name: string; // Anti-Mage
  primary_attr: 'str' | 'agi' | 'int' | 'all';
  attack_type: 'Melee' | 'Ranged';
  roles: string[]; // Carry, Support, Initiator, ...
  img: string; // путь на steamstatic, без домена
  icon: string;
  legs: number;
  /** pub_pick/pub_win по скобкам ранга 1..8 (8 = Immortal) */
  [key: `${number}_pick`]: number;
  [key: `${number}_win`]: number;
  pro_pick?: number;
  pro_win?: number;
  pro_ban?: number;
}

/** Элемент /api/heroes/{id}/matchups: сколько игр герой сыграл против hero_id и сколько выиграл. */
export interface Matchup {
  hero_id: number;
  games_played: number;
  wins: number;
}

/** /api/heroes/{id}/itemPopularity */
export interface ItemPopularity {
  start_game_items: Record<string, number>;
  early_game_items: Record<string, number>;
  mid_game_items: Record<string, number>;
  late_game_items: Record<string, number>;
}

/** Константа предмета из /api/constants/items */
export interface ItemConstant {
  id: number;
  img: string;
  dname?: string;
  cost?: number | null;
  /** component | consumable | common | rare | epic | artifact | secret_shop */
  qual?: string;
  /** Из чего собирается. Пусто у базовых предметов и компонентов. */
  components?: string[] | null;
  /** Статы: display — шаблон вида «+ {value} Strength». */
  attrib?: { key?: string; display?: string; value?: string | number }[];
  /** Активные и пассивные эффекты. */
  abilities?: { type?: string; title?: string; description?: string }[];
  notes?: string;
  /** Мана и перезарядка активной способности. */
  mc?: number | string | false;
  cd?: number | string | false;
}

/** Скобка ранга OpenDota: 1 = Herald … 8 = Immortal. */
export type Bracket = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Вклад одного вражеского героя в итоговую оценку кандидата. */
export interface CounterBreakdown {
  enemy: Hero;
  /** Винрейт кандидата против этого врага, % */
  winrate: number;
  /** Скорректированное на базовый винрейт преимущество, п.п. */
  advantage: number;
  games: number;
}

/** Вклад одного союзника. */
export interface SynergyBreakdown {
  ally: Hero;
  value: number;
  reason: string;
}

/** Итоговая рекомендация по одному кандидату. */
export interface Suggestion {
  hero: Hero;
  score: number;
  counterScore: number;
  synergyScore: number;
  metaScore: number;
  /** Суммарное число игр во всех учтённых матчапах — мера доверия к counterScore. */
  counterSample: number;
  counters: CounterBreakdown[];
  synergies: SynergyBreakdown[];
  roleNote?: string;
}

/** Настраиваемые веса алгоритма. */
export interface Weights {
  counter: number;
  synergy: number;
  meta: number;
}
