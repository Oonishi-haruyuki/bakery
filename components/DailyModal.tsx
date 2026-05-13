import React from 'react';
import { DailyEvent, BreadType } from '../types';
import { 
  SunIcon as Sun,
  CloudRainIcon as CloudRain,
  CloudIcon as Cloud,
  TrendingUpIcon as TrendingUp,
  ZapIcon as Zap,
  UsersIcon as Users
} from './Icon';
import { RECIPES } from '../constants';

interface DailyModalProps {
  event: DailyEvent;
  onClose: () => void;
}

const DailyModal: React.FC<DailyModalProps> = ({ event, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border-4 border-amber-200">
        <div className="bg-amber-100 p-6 border-b border-amber-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
            <Sun className="w-6 h-6 text-orange-500" />
            {event.day}日目の朝刊
          </h2>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              {event.weather.includes('雨') ? (
                <CloudRain className="w-8 h-8 text-blue-500" />
              ) : event.weather.includes('曇') ? (
                <Cloud className="w-8 h-8 text-gray-500" />
              ) : (
                <Sun className="w-8 h-8 text-orange-500" />
              )}
              <div>
                <p className="text-sm text-gray-500">今日の天気</p>
                <p className="text-xl font-bold text-gray-800">{event.weather}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-3 rounded-lg text-center border border-green-100">
                  <p className="text-xs text-green-700 font-bold mb-1">予想客足</p>
                  <p className={`text-xl font-bold ${event.salesModifier >= 1 ? 'text-green-600' : 'text-red-500'}`}>
                    {event.salesModifier.toFixed(2)}倍
                  </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg text-center border border-yellow-100">
                  <p className="text-xs text-yellow-800 font-bold mb-1">仕入れ相場</p>
                  <p className={`text-xl font-bold ${event.costModifier <= 1 ? 'text-green-600' : 'text-red-500'}`}>
                    {event.costModifier.toFixed(2)}倍
                  </p>
              </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-amber-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              本日のトレンド
            </h3>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              {event.trend ? (
                <>
                  <p className="font-bold text-lg text-amber-800 mb-1">
                    {RECIPES[event.trend].name}
                  </p>
                  <p className="text-sm text-amber-900/80 italic">
                    "{event.trendReason}"
                  </p>
                </>
              ) : (
                <p className="text-gray-600 italic">特に目立ったトレンドはありません。</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-amber-900 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Zap className="w-4 h-4 text-amber-600" />
              本日のデイリーミッション
            </h3>
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
              {event.missions.map(m => (
                <div key={m.id} className="flex items-center gap-3 text-sm text-stone-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                  {m.description}
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-stone-100 text-[10px] text-amber-700 font-bold">
                ※ 1つ達成で5万円、全達成で合計30万円獲得！
              </div>
            </div>
          </div>

          <div className="space-y-2">
             <h3 className="font-bold text-amber-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              街の声
            </h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 italic text-sm">
              "{event.customerSentiment}"
            </p>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-lg shadow-md transition-all active:scale-95"
          >
            開店準備をする！
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyModal;
