import React from 'react';

interface Props {
  name: string;
  count: number;
  unit?: string;
  icon?: React.ReactNode;
  variant?: 'ingredient' | 'bread';
}

const InventoryItem: React.FC<Props> = ({ name, count, unit = '', icon, variant = 'ingredient' }) => {
  return (
    <div className={`
      flex items-center justify-between p-3 rounded-lg border
      ${variant === 'bread' 
        ? 'bg-orange-50 border-orange-200' 
        : 'bg-stone-50 border-stone-200'}
    `}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium text-gray-700 text-sm">{name}</span>
      </div>
      <span className="font-bold text-gray-900">
        {count.toLocaleString()}
        <span className="text-xs font-normal text-gray-500 ml-1">{unit}</span>
      </span>
    </div>
  );
};

export default InventoryItem;
