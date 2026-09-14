import type { ItemConstant } from '../types';
import { itemImg } from '../api/opendota';

interface Props {
  item: ItemConstant;
  onClose(): void;
}

/**
 * Что даёт предмет. Данные из /api/constants/items:
 * attrib — статы (в display лежит шаблон вида «+ {value} Strength»),
 * abilities — активные и пассивные эффекты, notes — оговорки.
 */
export function ItemDetails({ item, onClose }: Props) {
  const stats = (item.attrib ?? []).filter((a) => a.display).map((a) => formatAttrib(a));

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="picker-grip" />
        <div className="sheet-head">
          <img src={itemImg(item)} alt="" />
          <div className="sheet-title">
            <strong>{item.dname ?? 'Item'}</strong>
            {typeof item.cost === 'number' && item.cost > 0 && <span>{item.cost} gold</span>}
          </div>
          <button className="picker-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="sheet-body">
          {stats.length > 0 && (
            <ul className="stat-list">
              {stats.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}

          {(item.abilities ?? []).map((ab) => (
            <section key={ab.title} className="ability">
              <h5>
                {ab.title}
                <span className="ability-type">{ab.type}</span>
              </h5>
              <p>{ab.description}</p>
            </section>
          ))}

          {(item.mc || item.cd) && (
            <p className="ability-cost">
              {item.mc ? `Mana: ${item.mc}` : ''}
              {item.mc && item.cd ? ' · ' : ''}
              {item.cd ? `Cooldown: ${item.cd}s` : ''}
            </p>
          )}

          {item.notes && <p className="item-notes">{item.notes}</p>}

          {stats.length === 0 && (item.abilities ?? []).length === 0 && (
            <p className="muted small">No description available for this item.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** «+ {value} Strength» + value «10» → «+ 10 Strength». */
function formatAttrib(a: { display?: string; value?: string | number }): string {
  const raw = String(a.display ?? '');
  const value = String(a.value ?? '');
  return raw.replace('{value}', value).replace(/%%/g, '%').trim();
}
