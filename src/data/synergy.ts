/**
 * Курируемые комбо. У OpenDota нет эндпоинта синергии пар — только матчапы
 * «герой против героя», поэтому эта часть основана на знании игры, а не
 * на статистике. Файл намеренно плоский, чтобы его было легко дополнять.
 *
 * Ключ героя = hero.name без префикса npc_dota_hero_ (например "magnataur").
 * value — вклад в очках, примерно в тех же единицах, что и п.п. преимущества.
 * reason показывается в интерфейсе, поэтому он на английском.
 */

export interface ComboRule {
  a: string;
  b: string;
  value: number;
  reason: string;
}

/** Порядок в паре не важен — сопоставление идёт в обе стороны. */
export const COMBOS: ComboRule[] = [
  // AoE ultimate setups
  { a: 'magnataur', b: 'sven', value: 6, reason: 'RP собирает пачку под God\'s Strength' },
  { a: 'magnataur', b: 'juggernaut', value: 5, reason: 'Reverse Polarity sets up Omnislash' },
  { a: 'magnataur', b: 'luna', value: 5, reason: 'Reverse Polarity sets up Eclipse' },
  { a: 'magnataur', b: 'invoker', value: 5, reason: 'Reverse Polarity sets up Sun Strike and Chaos Meteor' },
  { a: 'magnataur', b: 'earthshaker', value: 5, reason: 'Reverse Polarity into Echo Slam' },
  { a: 'enigma', b: 'earthshaker', value: 5, reason: 'Black Hole into Echo Slam' },
  { a: 'enigma', b: 'lina', value: 4, reason: 'Black Hole holds targets for Light Strike Array' },
  { a: 'enigma', b: 'leshrac', value: 4, reason: 'Black Hole holds targets in Pulse Nova' },
  { a: 'faceless_void', b: 'invoker', value: 5, reason: 'Chronosphere gives Invoker a free combo' },
  { a: 'faceless_void', b: 'disruptor', value: 5, reason: 'Chronosphere into Static Storm' },
  { a: 'faceless_void', b: 'lina', value: 4, reason: 'Chronosphere guarantees Laguna Blade' },
  { a: 'dark_seer', b: 'leshrac', value: 5, reason: 'Vacuum and Wall of Replica feed Pulse Nova' },
  { a: 'dark_seer', b: 'enigma', value: 5, reason: 'Vacuum stacks targets for Black Hole' },
  { a: 'dark_seer', b: 'sand_king', value: 5, reason: 'Vacuum into Epicenter' },
  { a: 'naga_siren', b: 'leshrac', value: 6, reason: 'Song of the Siren buys a free setup' },
  { a: 'naga_siren', b: 'enigma', value: 6, reason: 'Song of the Siren into Black Hole' },
  { a: 'naga_siren', b: 'sand_king', value: 5, reason: 'Song of the Siren into Epicenter' },
  { a: 'tidehunter', b: 'lina', value: 4, reason: 'Ravage holds targets for spells' },
  { a: 'tidehunter', b: 'lich', value: 4, reason: 'Ravage into Chain Frost' },
  { a: 'tidehunter', b: 'magnataur', value: 4, reason: 'Two layers of mass lockdown' },
  { a: 'kunkka', b: 'tidehunter', value: 4, reason: 'Torrent and X Marks combine with Ravage' },
  { a: 'kunkka', b: 'magnataur', value: 4, reason: 'Reverse Polarity holds the pack for Ghost Ship' },
  { a: 'warlock', b: 'enigma', value: 4, reason: 'Chaotic Offering into Black Hole' },
  { a: 'shadow_demon', b: 'lina', value: 4, reason: 'Disruption and Soul Catcher amplify burst' },
  { a: 'shadow_demon', b: 'lion', value: 4, reason: 'Soul Catcher doubles Finger of Death' },

  // Saves and carry buffs
  { a: 'omniknight', b: 'sven', value: 5, reason: 'Repel and heals keep a physical carry alive' },
  { a: 'omniknight', b: 'ursa', value: 5, reason: 'Repel lets Ursa stay in the fight' },
  { a: 'dazzle', b: 'ursa', value: 5, reason: 'Shallow Grave saves aggressive dives' },
  { a: 'dazzle', b: 'life_stealer', value: 4, reason: 'Shallow Grave and Weave support a melee carry' },
  { a: 'oracle', b: 'ursa', value: 5, reason: 'False Promise doubles the carry window' },
  { a: 'oracle', b: 'juggernaut', value: 4, reason: 'False Promise covers Omnislash' },
  { a: 'winter_wyvern', b: 'phantom_assassin', value: 4, reason: 'Cold Embrace keeps the carry alive' },
  { a: 'abaddon', b: 'phantom_assassin', value: 4, reason: 'Aphotic Shield strips stuns off the carry' },
  { a: 'crystal_maiden', b: 'ursa', value: 4, reason: 'Mana aura fuels aggressive jungling and Roshan' },
  { a: 'crystal_maiden', b: 'juggernaut', value: 3, reason: 'Mana aura and slow dominate the lane' },
  // Internal Dota names: Io is wisp, Clockwerk is rattletrap.
  { a: 'wisp', b: 'gyrocopter', value: 6, reason: 'Relocate into Call Down is a classic gank' },
  { a: 'wisp', b: 'chaos_knight', value: 5, reason: 'Tether and regen enable an illusion dive' },
  { a: 'wisp', b: 'tiny', value: 5, reason: 'Relocate into instant Toss' },
  { a: 'shadow_shaman', b: 'lycan', value: 4, reason: 'Serpent Wards push alongside wolves' },
  { a: 'undying', b: 'lycan', value: 4, reason: 'Tombstone plus push creates strong tempo' },

  // Auras and positioning
  { a: 'drow_ranger', b: 'sniper', value: 4, reason: 'Precision Aura boosts a ranged lineup' },
  { a: 'drow_ranger', b: 'clinkz', value: 4, reason: 'Precision Aura buffs a ranged carry' },
  { a: 'drow_ranger', b: 'windrunner', value: 3, reason: 'Precision Aura buffs a ranged mid' },
  { a: 'vengefulspirit', b: 'sniper', value: 4, reason: 'Vengeance Aura and Swap protect a fragile carry' },
  { a: 'vengefulspirit', b: 'drow_ranger', value: 4, reason: 'Minus armour stacks with the damage aura' },
  { a: 'beastmaster', b: 'sniper', value: 3, reason: 'Inner Beast speeds up ranged attackers' },
  { a: 'treant', b: 'phantom_assassin', value: 3, reason: 'Living Armor sustains the carry and towers' },

  // Burst and pick-offs
  { a: 'lion', b: 'lina', value: 3, reason: 'Double burst deletes supports instantly' },
  { a: 'zuus', b: 'ancient_apparition', value: 4, reason: 'Ice Blast plus magic damage finishes targets' },
  { a: 'ancient_apparition', b: 'lich', value: 3, reason: 'Ice Blast blocks healing and finishes kills' },
  { a: 'pudge', b: 'rattletrap', value: 4, reason: 'Cogs lock a target in place for Hook' },
  { a: 'pudge', b: 'shadow_demon', value: 4, reason: 'Disruption sets up a guaranteed Hook' },
  { a: 'nyx_assassin', b: 'zuus', value: 3, reason: 'Mana burn and vision enable burst' },

  // Push and split push
  { a: 'chen', b: 'lycan', value: 5, reason: 'Creeps and wolves push towers early' },
  { a: 'enchantress', b: 'lycan', value: 4, reason: 'Fast early tower push' },
  { a: 'furion', b: 'lycan', value: 4, reason: 'Global split push' },
  { a: 'pugna', b: 'furion', value: 4, reason: 'Nether Ward and treants melt towers' },

  // Illusions and summons
  { a: 'chaos_knight', b: 'shadow_demon', value: 5, reason: 'Disruption doubles the illusions' },
  { a: 'chaos_knight', b: 'legion_commander', value: 4, reason: 'Illusions boost Duel through Overwhelming Odds' },
  { a: 'phantom_lancer', b: 'shadow_demon', value: 4, reason: 'Disruption multiplies illusions' },
  { a: 'legion_commander', b: 'disruptor', value: 5, reason: 'Kinetic Field guarantees the Duel' },
  { a: 'legion_commander', b: 'shadow_demon', value: 4, reason: 'Disruption guarantees the Duel' },
];

/** Быстрый индекс: "a|b" (отсортированная пара) -> правило. */
const index = new Map<string, ComboRule>();
for (const c of COMBOS) {
  index.set([c.a, c.b].sort().join('|'), c);
}

export function comboFor(shortNameA: string, shortNameB: string): ComboRule | undefined {
  return index.get([shortNameA, shortNameB].sort().join('|'));
}

/** npc_dota_hero_antimage -> antimage */
export function shortName(heroName: string): string {
  return heroName.replace('npc_dota_hero_', '');
}
