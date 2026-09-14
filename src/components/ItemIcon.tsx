import type { ItemConstant } from '../types';
import { itemImg } from '../api/opendota';

interface Props {
  item: ItemConstant | undefined;
  fallbackName?: string;
  title?: string;
  /** Клик открывает карточку с описанием предмета. */
  onOpen?(item: ItemConstant): void;
}

export function ItemIcon({ item, fallbackName, title, onOpen }: Props) {
  const label = item?.dname ?? fallbackName ?? 'Unknown item';
  return (
    <button
      className="item"
      title={title ?? label}
      onClick={item && onOpen ? () => onOpen(item) : undefined}
      disabled={!item || !onOpen}
    >
      {item ? (
        <img src={itemImg(item)} alt={label} loading="lazy" />
      ) : (
        <div className="item-placeholder" />
      )}
      <span className="item-name">{label}</span>
    </button>
  );
}
