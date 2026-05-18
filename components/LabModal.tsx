
import React, { useState } from 'react';
import { 
  Icons, 
  FlaskConicalIcon as Flask,
  BeakerIcon as Beaker,
  ZapIcon as Zap,
  XIcon as X
} from './Icon';
import { IngredientType, BreadType, GameState } from '../types';
import { INGREDIENTS_DATA, RECIPES } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

interface LabModalProps {
  gameState: GameState;
  onDiscover: (breadType: BreadType) => void;
  onConsumeIngredients: (ingredients: Record<IngredientType, number>) => void;
  onClose: () => void;
}

const LabModal: React.FC<LabModalProps> = ({ gameState, onDiscover, onConsumeIngredients, onClose }) => {
  const [selectedIngredients, setSelectedIngredients] = useState<Partial<Record<IngredientType, number>>>({});
  const [isDeveloping, setIsDeveloping] = useState(false);
  const [result, setResult] = useState<{ success: boolean; breadType?: BreadType; message: string } | null>(null);

  const toggleIngredient = (type: IngredientType) => {
    setSelectedIngredients(prev => {
      const next = { ...prev };
      if (next[type] === undefined) {
        next[type] = 1;
      } else {
        delete next[type];
      }
      return next;
    });
  };

  const updateAmount = (type: IngredientType, delta: number) => {
    setSelectedIngredients(prev => {
      if (prev[type] === undefined) return prev;
      return {
        ...prev,
        [type]: Math.max(1, (prev[type] || 0) + delta)
      };
    });
  };

  const handleDevelop = () => {
    // Check if player has enough ingredients
    for (const [type, amount] of Object.entries(selectedIngredients)) {
      if (gameState.ingredients[type as IngredientType] < (amount || 0)) {
        alert(`${INGREDIENTS_DATA[type as IngredientType].name}が足りません！`);
        return;
      }
    }

    setIsDeveloping(true);
    setResult(null);

    // Simulation delay
    setTimeout(() => {
      onConsumeIngredients(selectedIngredients as Record<IngredientType, number>);
      
      // Matching logic
      let matchedBread: BreadType | null = null;
      let hint: string = "何も発見できませんでした... 配合を変えてみましょう。";

      for (const recipe of Object.values(RECIPES)) {
        // Check if all required ingredients are present and in correct amounts (or more)
        const recipeIngredients = recipe.ingredients;
        const selectedKeys = Object.keys(selectedIngredients) as IngredientType[];
        const recipeKeys = Object.keys(recipeIngredients) as IngredientType[];

        // Exact match of ingredient types
        const sameTypes = selectedKeys.length === recipeKeys.length && 
                          selectedKeys.every(k => recipeKeys.includes(k));

        if (sameTypes) {
          // Check ratios
          const allAmountsMatch = recipeKeys.every(k => (selectedIngredients[k] || 0) === (recipeIngredients[k] || 0));
          
          if (allAmountsMatch) {
            matchedBread = recipe.id;
            break;
          } else {
            hint = `${recipe.name}に近い配合ですが、分量が少し違うようです...`;
          }
        }
      }

      if (matchedBread) {
        if (gameState.discoveredBreads.includes(matchedBread)) {
          setResult({ success: false, message: `新発見！...と思われましたが、すでに知っている「${RECIPES[matchedBread].name}」のレシピでした。` });
        } else {
          onDiscover(matchedBread);
          setResult({ success: true, breadType: matchedBread, message: `新レシピ発見！「${RECIPES[matchedBread].name}」の作り方をマスターしました！` });
        }
      } else {
        setResult({ success: false, message: hint });
      }
      
      setIsDeveloping(false);
    }, 2000);
  };

  const selectedCount = Object.keys(selectedIngredients).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl border-4 border-indigo-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Flask className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">パン開発ラボ</h2>
              <p className="text-indigo-100 text-xs">材料を組み合わせて新しいパンを創り出そう</p>
            </div>
          </div>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Ingredients list */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r border-stone-100 bg-stone-50/30">
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Icons.ChefHat className="w-4 h-4" /> 使用する材料を選択
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(INGREDIENTS_DATA).map(item => {
                const isSelected = selectedIngredients[item.id] !== undefined;
                const stock = gameState.ingredients[item.id];
                return (
                  <div 
                    key={item.id}
                    onClick={() => toggleIngredient(item.id)}
                    className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col relative overflow-hidden group cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-50 border-indigo-300 shadow-md ring-2 ring-indigo-200 ring-offset-2' 
                        : 'bg-white border-stone-100 hover:border-indigo-200 hover:bg-stone-50/50'
                    }`}
                  >
                    <span className="text-xs font-bold text-stone-800">{item.name}</span>
                    <span className="text-[10px] text-stone-400">在庫: {stock}{item.unit}</span>
                    {isSelected && (
                      <div className="mt-2 flex items-center justify-between bg-white rounded-lg p-1 border border-indigo-200">
                        <button 
                          onClick={(e) => { e.stopPropagation(); updateAmount(item.id, -1); }}
                          className="w-6 h-6 flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 rounded text-indigo-700 transition-colors"
                        >
                          -
                        </button>
                        <span className="text-xs font-black text-indigo-600">{selectedIngredients[item.id]}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); updateAmount(item.id, 1); }}
                          className="w-6 h-6 flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 rounded text-indigo-700 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-0 right-0 p-1 bg-indigo-500 text-white rounded-bl-xl shadow-sm">
                        <Icons.Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mixing Area */}
          <div className="w-full md:w-1/2 p-8 flex flex-col items-center justify-center bg-white relative">
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <div className={`w-32 h-32 rounded-full bg-stone-100 flex items-center justify-center border-8 border-stone-200 relative z-10 ${isDeveloping ? 'animate-bounce' : ''}`}>
                  <Beaker className={`w-16 h-16 ${selectedCount > 0 ? 'text-indigo-500' : 'text-stone-300'}`} />
                </div>
                {isDeveloping && (
                  <>
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute inset-0 bg-indigo-400 rounded-full blur-2xl"
                    />
                    <div className="absolute -top-4 -right-4 bg-yellow-400 p-2 rounded-full animate-spin">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                  </>
                )}
              </div>
              <h3 className="mt-6 text-xl font-black text-stone-800">実験エリア</h3>
              <p className="text-stone-400 text-sm italic">
                {selectedCount === 0 ? "材料を選択してください" : `${selectedCount} 種類の材料がセットされています`}
              </p>
            </div>

            <div className="w-full max-w-xs space-y-4">
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl border-2 text-center ${result.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}
                  >
                    <p className="text-sm font-bold">{result.message}</p>
                    {result.breadType && (
                      <div className="mt-3 py-2 bg-white rounded-xl font-black tracking-widest uppercase text-xs shadow-sm">
                        {RECIPES[result.breadType].name}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="h-[72px]" /> // Placeholder
                )}
              </AnimatePresence>

              <button 
                disabled={selectedCount === 0 || isDeveloping}
                onClick={handleDevelop}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-200 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 disabled:cursor-not-allowed flex items-center justify-center gap-3 overflow-hidden group"
              >
                {isDeveloping ? (
                  <>
                    <Icons.Loader2 className="w-5 h-5 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Icons.Zap className="w-5 h-5 group-hover:animate-pulse" />
                    レシピ開発を開始
                  </>
                )}
              </button>

              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">ヒント</h4>
                <p className="text-[10px] text-stone-500 leading-relaxed italic">
                  まずは「特製食パン」や「あんパン」の材料から試してみましょう。
                  配合（分量）が合致すると、そのパンを焼けるようになります。
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LabModal;
