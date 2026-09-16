import { useState } from 'react';
import type { Hero, ItemConstant, ItemPopularity } from '../types';
import { ItemDetails } from './ItemDetails';
import { useItemConstants, useItemPopularity, useStats } from '../hooks/useDota';
import { ItemIcon } from './ItemIcon';
import { counterItems, draftThreats } from '../data/itemCounters';
import { shortName } from '../data/synergy';
import { isWholeItem } from '../data/wholeItems';
import { fitsPosition } from '../data/itemRoles';
import { counterItemsOf, itemsOf } from '../api/stats';
import { POSITION_LABEL, positionsOf, type Position } from '../data/positions';

const TOP_CORE = 10;
const TOP_START = 7;
/** Винрейт предмета при меньшей выборке — шум, показываем только долю сборок. */
const MIN_ITEM_GAMES = 60;

interface Props {
  hero: Hero;
  /** Если передан вражеский драфт — сверху появится блок «против этого драфта». */
  enemies?: Hero[];
}

export function HeroBuild({ hero, enemies = [] }: Props) {
  const items = useItemConstants();
  const popularity = useItemPopularity(hero.id);
  const stats = useStats();

  const heroPositions = positionsOf(shortName(hero.name));
  const [position, setPosition] = useState<Position | null>(heroPositions[0] ?? null);
  const [openItem, setOpenItem] = useState<ItemConstant | null>(null);

  const byId = items.data?.byId;
  const byKey = items.data?.byKey;

  const enemyShort = enemies.map((e) => shortName(e.name));
  const counters = enemies.length ? counterItems(enemyShort, enemies.map((e) => e.localized_name)) : [];
  const threats = enemies.length ? draftThreats(enemyShort) : [];

  // Что реально собирают победители против этих героев. Курируемые правила
  // остаются ниже — они объясняют «почему», а это показывает «что».
  // Берём с запасом: компоненты вроде Javelin и Demon Edge отсеиваются ниже,
  // а без запаса после фильтра в блоке оставалась пара иконок.
  const measured = counterItemsOf(
    stats,
    enemies.map((e) => ({ id: e.id, name: e.localized_name })),
    40,
  )
    .map((c) => ({ ...c, found: byId?.get(c.id) }))
    .filter((c) => isWholeItem(c.found?.key ?? '', c.found?.item))
    .slice(0, 10);

  // Старт — это танго, ветки и квеллинг. Фильтр «целых предметов» здесь
  // неуместен: он выбрасывал ровно то, что на старте и покупают.
  const starting = phaseItems(popularity.data, 'start_game_items', byId, TOP_START);

  // Ядро сборки берём из своих данных (финальный инвентарь по матчам Steam),
  // а если снапшота нет — падаем на закуп OpenDota.
  const own = itemsOf(stats, hero.id)
    .map((s) => ({ ...s, found: byId?.get(s.id) }))
    .filter((s) => isWholeItem(s.found?.key ?? '', s.found?.item))
    .filter((s) => position === null || fitsPosition(s.found?.key ?? '', position))
    .slice(0, TOP_CORE);

  const fallbackCore = own.length
    ? []
    : ['mid_game_items', 'late_game_items'].flatMap((k) =>
        phaseItems(popularity.data, k as keyof ItemPopularity, byId, TOP_CORE, position),
      );

  return (
    <div className="build">
      {enemies.length > 0 && (
        <section className="counter-build">
          <h4>Against Enemy Draft</h4>
          {threats.length > 0 && (
            <ul className="threats">
              {threats.map((t) => (
                <li key={t.label}>
                  {t.label}
                  <b>{t.heroes.length}</b>
                </li>
              ))}
            </ul>
          )}
          {measured.length > 0 && (
            <>
              <p className="phase-label">Most built by winners against this draft</p>
              <div className="item-row">
                {measured.map((c) => (
                  <ItemIcon
                    key={c.id}
                    item={c.found?.item}
                    fallbackName={`#${c.id}`}
                    caption={`${c.rate.toFixed(0)}%`}
                    title={
                      c.against.length
                        ? `${c.found?.item.dname ?? ''} — in ${c.rate.toFixed(0)}% of winning builds, especially against ${c.against.join(' and ')}`
                        : `${c.found?.item.dname ?? ''} — in ${c.rate.toFixed(0)}% of winning builds`
                    }
                    onOpen={setOpenItem}
                  />
                ))}
              </div>
            </>
          )}

          {counters.length === 0 ? (
            measured.length === 0 && (
              <p className="muted small">No special item requirements — go with the standard build.</p>
            )
          ) : (
            <>
              {measured.length > 0 && <p className="phase-label">What this draft demands</p>}
              <div className="item-row">
                {counters.slice(0, 10).map((c) => (
                  <ItemIcon
                    key={c.item}
                    item={lookup(byKey, c.item)}
                    fallbackName={c.item}
                    title={`${c.reasons.join('; ')} — because of ${c.triggeredBy.join(', ')}`}
                    onOpen={setOpenItem}
                  />
                ))}
              </div>
              <ul className="reasons">
                {counters.slice(0, 5).map((c) => (
                  <li key={c.item}>
                    <strong>{lookup(byKey, c.item)?.dname ?? c.item}</strong> — {c.reasons[0]} (
                    {c.triggeredBy.join(', ')})
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {heroPositions.length > 0 && (
        <div className="chips chips-sm">
          {heroPositions.map((p) => (
            <button key={p} className={`chip${position === p ? ' is-on' : ''}`} onClick={() => setPosition(p)}>
              {POSITION_LABEL[p]}
            </button>
          ))}
          <button className={`chip${position === null ? ' is-on' : ''}`} onClick={() => setPosition(null)}>
            All
          </button>
        </div>
      )}

      {popularity.loading && <p className="muted small">Loading items…</p>}
      {popularity.error && <p className="error small">{popularity.error}</p>}

      {starting.length > 0 && (
        <section className="phase">
          <h4>Starting Items</h4>
          <div className="item-row">
            {starting.map((e) => (
              <ItemIcon key={e.id} item={e.found?.item} fallbackName={`#${e.id}`} onOpen={setOpenItem} />
            ))}
          </div>
        </section>
      )}

      <section className="phase">
        <h4>
          Core Items
          {own.length > 0 && <span className="section-count">win rate</span>}
        </h4>
        {own.length > 0 ? (
          <div className="item-row">
            {own.map((s) => (
              <ItemIcon
                key={s.id}
                item={s.found?.item}
                fallbackName={`#${s.id}`}
                caption={s.games >= MIN_ITEM_GAMES ? `${s.winrate.toFixed(0)}%` : `${s.pickRate.toFixed(0)}%`}
                captionTone={s.games >= MIN_ITEM_GAMES ? (s.winrate >= 50 ? 'pos' : 'neg') : undefined}
                title={
                  s.games >= MIN_ITEM_GAMES
                    ? `${s.found?.item.dname ?? ''} — ${s.winrate.toFixed(1)}% win rate over ${s.games.toLocaleString('en')} games`
                    : `${s.found?.item.dname ?? ''} — in ${s.pickRate.toFixed(0)}% of builds (${s.games} games, too few for a win rate)`
                }
                onOpen={setOpenItem}
              />
            ))}
          </div>
        ) : fallbackCore.length > 0 ? (
          <div className="item-row">
            {fallbackCore.map((e) => (
              <ItemIcon key={e.id} item={e.found?.item} fallbackName={`#${e.id}`} onOpen={setOpenItem} />
            ))}
          </div>
        ) : (
          <p className="muted small">No item data yet.</p>
        )}
      </section>

      <p className="build-note">
        {own.length > 0
          ? `Core items from ${stats?.matches.toLocaleString('en')} collected matches. Numbers are win rate with the item, or build share where the sample is still small.`
          : 'Core items from OpenDota purchase stats.'}
        {position !== null && ` Filtered for ${POSITION_LABEL[position]}.`}
      </p>

      {openItem && <ItemDetails item={openItem} onClose={() => setOpenItem(null)} />}
    </div>
  );
}

interface PhaseEntry {
  id: number;
  found?: { key: string; item: ItemConstant };
}

/** Топ предметов фазы из статистики закупа OpenDota. */
function phaseItems(
  data: ItemPopularity | null,
  key: keyof ItemPopularity,
  byId: Map<number, { key: string; item: ItemConstant }> | undefined,
  limit: number,
  position?: Position | null,
): PhaseEntry[] {
  if (!data) return [];
  return Object.entries(data[key] ?? {})
    .map(([id, count]) => ({ id: Number(id), count: count as number }))
    .sort((a, b) => b.count - a.count)
    .map((e) => ({ id: e.id, found: byId?.get(e.id) }))
    .filter((e) => {
      if (!e.found) return false;
      // На старте компоненты и расходники — это и есть сборка, их не режем.
      if (key === 'start_game_items') return true;
      if (!isWholeItem(e.found.key, e.found.item)) return false;
      return position == null || fitsPosition(e.found.key, position);
    })
    .slice(0, limit);
}

function lookup(byKey: Record<string, ItemConstant> | undefined, key: string): ItemConstant | undefined {
  return byKey?.[key];
}
