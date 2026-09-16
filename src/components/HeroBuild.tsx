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

const TOP_START = 8;
/** Граница между ранним закупом и ядром, золото. */
const EARLY_COST = 2300;
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
    .filter((s) => position === null || fitsPosition(s.found?.key ?? '', position));

  // Этапы разводим по цене: дешёвое собирают рано, дорогое — это ядро.
  const early = own.filter((s) => (s.found?.item.cost ?? 0) <= EARLY_COST).slice(0, 8);
  const core = own.filter((s) => (s.found?.item.cost ?? 0) > EARLY_COST).slice(0, 8);
  // Ситуативное: берут не всегда, но с ним выигрывают заметно чаще.
  const shown = new Set([...early, ...core].map((s) => s.id));
  const situational = own
    .filter((s) => !shown.has(s.id) && s.games >= MIN_ITEM_GAMES && s.pickRate >= 8 && s.winrate >= 52)
    .sort((a, b) => b.winrate - a.winrate)
    .slice(0, 8);

  const fallbackCore = own.length
    ? []
    : ['mid_game_items', 'late_game_items'].flatMap((k) =>
        phaseItems(popularity.data, k as keyof ItemPopularity, byId, 10, position),
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

      {own.length > 0 ? (
        <>
          <ItemStage title="Early Game" items={early} onOpen={setOpenItem} />
          <ItemStage title="Core Items" items={core} onOpen={setOpenItem} />
          <ItemStage title="Situational" items={situational} onOpen={setOpenItem} hint="higher win rate" />
        </>
      ) : fallbackCore.length > 0 ? (
        <section className="phase">
          <h4>Core Items</h4>
          <div className="item-row">
            {fallbackCore.map((e) => (
              <ItemIcon key={e.id} item={e.found?.item} fallbackName={`#${e.id}`} onOpen={setOpenItem} />
            ))}
          </div>
        </section>
      ) : (
        <p className="muted small">No item data yet.</p>
      )}

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

interface StageItem {
  id: number;
  games: number;
  pickRate: number;
  winrate: number;
  found?: { key: string; item: ItemConstant };
}

/** Один этап сборки: иконки с долей сборок и винрейтом, как в таблицах D2PT. */
function ItemStage({
  title,
  items,
  hint,
  onOpen,
}: {
  title: string;
  items: StageItem[];
  hint?: string;
  onOpen(item: ItemConstant): void;
}) {
  if (items.length === 0) return null;
  return (
    <section className="phase">
      <h4>
        {title}
        <span className="section-count">{hint ?? 'built · won'}</span>
      </h4>
      <div className="item-row">
        {items.map((s) => (
          <ItemIcon
            key={s.id}
            item={s.found?.item}
            fallbackName={`#${s.id}`}
            caption={`${s.pickRate.toFixed(0)}%`}
            subCaption={s.games >= MIN_ITEM_GAMES ? `${s.winrate.toFixed(0)}%` : undefined}
            subCaptionTone={s.winrate >= 50 ? 'pos' : 'neg'}
            title={
              `${s.found?.item.dname ?? ''} — in ${s.pickRate.toFixed(0)}% of builds` +
              (s.games >= MIN_ITEM_GAMES
                ? `, ${s.winrate.toFixed(1)}% win rate over ${s.games.toLocaleString('en')} games`
                : ` (${s.games} games — too few for a win rate)`)
            }
            onOpen={onOpen}
          />
        ))}
      </div>
    </section>
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
