import type { Hero, ItemConstant, ItemPopularity } from '../types';
import { useItemConstants, useItemPopularity } from '../hooks/useDota';
import { ItemIcon } from './ItemIcon';
import { counterItems, draftThreats } from '../data/itemCounters';
import { shortName } from '../data/synergy';

const PHASES: { key: keyof ItemPopularity; label: string }[] = [
  { key: 'start_game_items', label: 'Старт' },
  { key: 'early_game_items', label: 'Ранняя игра' },
  { key: 'mid_game_items', label: 'Середина' },
  { key: 'late_game_items', label: 'Поздняя игра' },
];

const TOP_PER_PHASE = 8;

interface Props {
  hero: Hero;
  /** Если передан вражеский драфт — под билдом появится блок «против этого драфта». */
  enemies?: Hero[];
}

export function HeroBuild({ hero, enemies = [] }: Props) {
  const items = useItemConstants();
  const popularity = useItemPopularity(hero.id);

  const byId = items.data?.byId;
  const byKey = items.data?.byKey;

  const enemyShort = enemies.map((e) => shortName(e.name));
  const counters = enemies.length ? counterItems(enemyShort, enemies.map((e) => e.localized_name)) : [];
  const threats = enemies.length ? draftThreats(enemyShort) : [];

  return (
    <div className="build">
      <h3>Популярный закуп · {hero.localized_name}</h3>
      <p className="muted small">Данные OpenDota: что реально покупают на этом герое в паблик-матчах.</p>

      {popularity.loading && <p className="muted">Загрузка закупа…</p>}
      {popularity.error && <p className="error">{popularity.error}</p>}

      {popularity.data &&
        PHASES.map(({ key, label }) => {
          const entries = Object.entries(popularity.data![key] ?? {})
            .map(([id, count]) => ({ id: Number(id), count: count as number }))
            .sort((a, b) => b.count - a.count)
            .slice(0, TOP_PER_PHASE);
          if (entries.length === 0) return null;
          return (
            <section key={key} className="phase">
              <h4>{label}</h4>
              <div className="item-row">
                {entries.map(({ id, count }) => {
                  const found = byId?.get(id);
                  return (
                    <ItemIcon
                      key={id}
                      item={found?.item}
                      fallbackName={`#${id}`}
                      caption={formatCount(count)}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}

      {enemies.length > 0 && (
        <section className="phase counter-build">
          <h4>Против драфта соперника</h4>
          {threats.length > 0 && (
            <ul className="threats">
              {threats.map((t) => (
                <li key={t.label}>
                  <span className="tag">{t.label}</span> {t.heroes.length} геро
                  {t.heroes.length === 1 ? 'й' : 'я'}
                </li>
              ))}
            </ul>
          )}
          {counters.length === 0 ? (
            <p className="muted">Особых требований к закупу нет — берите стандартный билд.</p>
          ) : (
            <div className="item-row">
              {counters.slice(0, 10).map((c) => (
                <ItemIcon
                  key={c.item}
                  item={lookup(byKey, c.item)}
                  fallbackName={c.item}
                  caption={c.triggeredBy.slice(0, 2).join(', ')}
                  title={`${c.reasons.join('; ')} — из-за: ${c.triggeredBy.join(', ')}`}
                />
              ))}
            </div>
          )}
          {counters.length > 0 && (
            <ul className="reasons">
              {counters.slice(0, 5).map((c) => (
                <li key={c.item}>
                  <strong>{lookup(byKey, c.item)?.dname ?? c.item}</strong> — {c.reasons[0]} (
                  {c.triggeredBy.join(', ')})
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function lookup(byKey: Record<string, ItemConstant> | undefined, key: string): ItemConstant | undefined {
  return byKey?.[key];
}

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
