
import React, { useState } from 'react';
import { 
  Icons, 
  FlaskConicalIcon as Flask,
  BeakerIcon as Beaker,
  ZapIcon as Zap,
  XIcon as X,
  ShoppingBagIcon as ShoppingBag,
  InfoIcon as Info,
  CheckIcon as Check
} from './Icon';
import { IngredientType, BreadType, GameState } from '../types';
import { INGREDIENTS_DATA, RECIPES } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

interface LabModalProps {
  gameState: GameState;
  onDiscover: (breadType: BreadType) => void;
  onBuyRecipe: (breadType: BreadType, cost: number) => void;
  onConsumeIngredients: (ingredients: Record<IngredientType, number>) => void;
  onClose: () => void;
}

const LabModal: React.FC<LabModalProps> = ({ gameState, onDiscover, onBuyRecipe, onConsumeIngredients, onClose }) => {
  const [activeTab, setActiveTab] = useState<'lab' | 'shop'>('lab');
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

  const buyableRecipes = Object.values(RECIPES).filter(r => 
    r.levelRequired <= gameState.shopLevel && 
    !gameState.discoveredBreads.includes(r.id)
  );

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
              <h2 className="text-2xl font-black tracking-tight">パン開発ラボ & ショップ</h2>
              <p className="text-indigo-100 text-xs">新しいレシピを発見、または購入しましょう</p>
            </div>
          </div>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-indigo-50 border-b border-indigo-100 flex p-1 gap-1">
          <button 
            onClick={() => setActiveTab('lab')}
            className={`flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'lab' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-200' : 'text-indigo-400 hover:text-indigo-600 hover:bg-white/50'}`}
          >
            <Flask className="w-4 h-4" /> 配合実験 (Lab)
          </button>
          <button 
            onClick={() => setActiveTab('shop')}
            className={`flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'shop' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-200' : 'text-indigo-400 hover:text-indigo-600 hover:bg-white/50'}`}
          >
            <ShoppingBag className="w-4 h-4" /> レシピショップ (Shop)
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {activeTab === 'lab' ? (
            <>
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
                            <Check className="w-3 h-3" />
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
                        <Zap className="w-5 h-5 group-hover:animate-pulse" />
                        レシピ開発を開始
                      </>
                    )}
                  </button>

                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                    <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">ヒント</h4>
                    <p className="text-[10px] text-stone-500 leading-relaxed italic">
                      材料と分量を組み合わせて、新しいレシピを発見できます。<br/>
                      レシピショップで購入することも可能です。
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full p-8 overflow-y-auto bg-stone-50/50">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-stone-800">購入可能なレシピ</h3>
                  <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-stone-200 shadow-sm">
                    <span className="text-[10px] font-bold text-stone-400">SHOP RANK:</span>
                    <span className="text-xs font-black text-indigo-600">{gameState.shopLevel}</span>
                  </div>
                </div>

                {buyableRecipes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {buyableRecipes.map(recipe => {
                      const recipeCost = (recipe.levelRequired || 1) * 20000;
                      const canAfford = gameState.money >= recipeCost;
                      return (
                        <div key={recipe.id} className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between group hover:border-indigo-300 transition-all">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-stone-800">{recipe.name}</h4>
                              <div className="text-[10px] px-2 py-0.5 bg-stone-100 text-stone-500 rounded font-bold">LEVEL {recipe.levelRequired}</div>
                            </div>
                            <p className="text-xs text-stone-500 mb-4 h-8 overflow-hidden line-clamp-2">{recipe.description}</p>
                            <div className="space-y-1 mb-6">
                              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">必要な材料:</div>
                              <div className="flex flex-wrap gap-1">
                                {Object.keys(recipe.ingredients).map(ing => (
                                  <span key={ing} className="text-[9px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                                    {INGREDIENTS_DATA[ing as IngredientType].name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <button 
                            disabled={!canAfford}
                            onClick={() => onBuyRecipe(recipe.id, recipeCost)}
                            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${canAfford ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700' : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}
                          >
                            <span>¥{recipeCost.toLocaleString()} で購入</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Info className="w-8 h-8 text-stone-300" />
                    </div>
                    <p className="text-stone-500 font-bold">現在購入可能な新しいレシピはありません</p>
                    <p className="text-stone-400 text-xs mt-2">お店のランクを上げると、新しいレシピが並びます</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LabModal;
