import type { ItemConstant } from '../types';
import { itemImg } from '../api/opendota';

interface Props {
  item: ItemConstant | undefined;
  fallbackName?: string;
  title?: string;
}

export function ItemIcon({ item, fallbackName, title }: Props) {
  const label = item?.dname ?? fallbackName ?? 'Неизвестный предмет';
  return (
    <div className="item" title={title ?? label}>
      {item ? (
        <img src={itemImg(item)} alt={label} loading="lazy" />
      ) : (
        <div className="item-placeholder" />
      )}
      <span className="item-name">{label}</span>
    </div>
  );
}
