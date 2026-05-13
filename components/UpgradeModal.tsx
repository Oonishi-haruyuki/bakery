import React from 'react';
import { UpgradeStats } from '../types';
import { UPGRADES_DATA } from '../constants';
import { 
  HammerIcon as Hammer,
  AlertCircleIcon as AlertCircle,
  CoinsIcon as Coins,
  UsersIcon as Users,
  Building2Icon as Building2,
  ZapIcon as Zap,
  PackagePlusIcon as PackagePlus,
  MegaphoneIcon as Megaphone,
  CoffeeIcon as Coffee
} from './Icon';

interface UpgradeModalProps {
  currentMoney: number;
  upgrades: UpgradeStats;
  onBuy: (key: keyof UpgradeStats, cost: number) => void;
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ currentMoney, upgrades, onBuy, onClose }) => {
  
  const getCost = (key: keyof UpgradeStats, currentLevel: number) => {
    const data = UPGRADES_DATA[key];
    return Math.floor(data.baseCost * Math.pow(data.costMultiplier, currentLevel));
  };

  const renderUpgradeItem = (key: keyof UpgradeStats, icon: React.ReactNode) => {
    const data = UPGRADES_DATA[key];
    const currentLevel = upgrades[key];
    const isMaxed = currentLevel >= data.maxLevel;
    
    const cost = getCost(key, currentLevel);
    const canAfford = currentMoney >= cost;

    return (
      <div key={key} className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-3 rounded-lg ${isMaxed ? 'bg-amber-100 text-amber-500' : 'bg-blue-100 text-blue-600'}`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-stone-800 flex items-center gap-2">
              {data.name} 
              <span className="text-xs bg-stone-100 px-2 py-0.5 rounded text-stone-500">
                {key === 'branches' ? `${currentLevel}店舗` : key === 'staff' ? `${currentLevel}人` : `Lv.${currentLevel}`} / {data.maxLevel}
              </span>
            </h3>
            <p className="text-xs text-stone-500 mt-1">{data.description}</p>
          </div>
        </div>

        {isMaxed ? (
          <div className="px-6 py-2 bg-gray-100 text-gray-400 font-bold rounded-lg text-sm whitespace-nowrap">
            MAX
          </div>
        ) : (
          <button
            onClick={() => onBuy(key, cost)}
            disabled={!canAfford}
            className={`px-4 py-2 rounded-lg font-bold text-sm flex flex-col items-center min-w-[100px] transition-all
              ${canAfford 
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md active:translate-y-0.5' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
            `}
          >
            <span>{key === 'branches' ? '開店する' : key === 'staff' ? '採用する' : '強化する'}</span>
            <span className="text-xs opacity-90">¥{cost.toLocaleString()}</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-stone-50 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border-4 border-amber-500 flex flex-col max-h-[90vh]">
        <div className="bg-amber-500 p-4 flex justify-between items-center text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Hammer className="w-6 h-6" />
            設備投資・アップグレード
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <AlertCircle className="w-6 h-6 rotate-45" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
          <div className="bg-yellow-100 p-3 rounded-lg flex items-center gap-2 text-yellow-800 text-sm font-bold mb-4">
            <Coins className="w-5 h-5" />
            現在の資金: ¥{currentMoney.toLocaleString()}
          </div>

          {renderUpgradeItem('staff', <Users className="w-6 h-6" />)}
          <hr className="border-stone-200 my-2" />
          {renderUpgradeItem('branches', <Building2 className="w-6 h-6" />)}
          {renderUpgradeItem('speed', <Zap className="w-6 h-6" />)}
          {renderUpgradeItem('batch', <PackagePlus className="w-6 h-6" />)}
          {renderUpgradeItem('promo', <Megaphone className="w-6 h-6" />)}
          {renderUpgradeItem('eatIn', <Coffee className="w-6 h-6" />)}
        </div>
        
        <div className="p-4 border-t border-stone-200 bg-white">
             <button onClick={onClose} className="w-full py-3 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-xl transition-colors">
                閉じる
             </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
