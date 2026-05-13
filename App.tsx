
import React, { useState, useEffect, useRef } from 'react';
import { 
  Icons, 
  WheatIcon as Wheat, 
  StoreIcon as Store,
  ChefHatIcon as ChefHat,
  ShoppingBagIcon as ShoppingBag,
  TrendingUpIcon as TrendingUp,
  ZapIcon as Zap,
  SunIcon as Sun,
  HammerIcon as Hammer
} from './components/Icon';
import DailyModal from './components/DailyModal';
import InventoryItem from './components/InventoryItem';
import UpgradeModal from './components/UpgradeModal';
import Bakery3DScene from './components/Bakery3DScene';
import { generateDailyReport } from './services/geminiService';
import { auth, loginWithGoogle, saveGameState, loadGameState } from './services/firebaseService';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { 
  GameState, 
  IngredientType, 
  BreadType, 
  DailyEvent,
  UpgradeStats,
  DailyMission
} from './types';
import { INGREDIENTS_DATA, RECIPES, INITIAL_MONEY, getLevelUpThreshold, DAILY_WAGE_PER_STAFF, UPGRADES_DATA } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [gameState, setGameState] = useState<GameState>({
    money: INITIAL_MONEY,
    day: 1,
    dailyEarnings: 0,
    reputation: 10,
    shopLevel: 1,
    levelProgressSales: 0,
    ingredients: {
      [IngredientType.FLOUR]: 100, [IngredientType.SUGAR]: 100, [IngredientType.BUTTER]: 100,
      [IngredientType.YEAST]: 100, [IngredientType.MILK]: 100, [IngredientType.EGGS]: 100,
      [IngredientType.SALT]: 100, [IngredientType.CHOCO]: 100, [IngredientType.ANKO]: 100,
      [IngredientType.CURRY]: 100, [IngredientType.VEGETABLES]: 100, [IngredientType.MEAT]: 100,
      [IngredientType.FISH]: 100,
    },
    ingredientLimits: {
      [IngredientType.FLOUR]: 200, [IngredientType.SUGAR]: 200, [IngredientType.BUTTER]: 200,
      [IngredientType.YEAST]: 200, [IngredientType.MILK]: 200, [IngredientType.EGGS]: 200,
      [IngredientType.SALT]: 200, [IngredientType.CHOCO]: 200, [IngredientType.ANKO]: 200,
      [IngredientType.CURRY]: 200, [IngredientType.VEGETABLES]: 200, [IngredientType.MEAT]: 200,
      [IngredientType.FISH]: 200,
    },
    inventory: Object.values(BreadType).reduce((acc, type) => ({ ...acc, [type]: 0 }), {} as Record<BreadType, number>),
    isShopOpen: false,
    bakingStatus: Object.values(BreadType).reduce((acc, type) => ({ ...acc, [type]: null }), {} as Record<BreadType, number | null>),
    upgrades: { speed: 0, batch: 0, promo: 0, branches: 1, eatIn: 0, staff: 0, brand: 0 },
    currentMissions: [],
    allMissionsBonusClaimed: false,
    isFeverMode: false,
    feverEndTime: null
  });

  const [dailyEvent, setDailyEvent] = useState<DailyEvent | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [lastSale, setLastSale] = useState<{ id: number; bread: BreadType; timestamp: number } | null>(null);

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 50));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const saved = await loadGameState(u.uid);
        if (saved) {
          // Merge saved state with defaults to handle potential schema updates
          setGameState(prev => ({ ...prev, ...saved }));
          addLog("データの同期が完了しました。");
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Periodic Auto-save
  useEffect(() => {
    if (!user || gameState.isShopOpen) return;
    const saveInterval = setInterval(() => {
      saveGameState(user.uid, gameState);
    }, 30000); // Save every 30 seconds while shop is closed
    return () => clearInterval(saveInterval);
  }, [user, gameState]);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      addLog("ログインに失敗しました。");
    }
  };

  const processMissionUpdates = (prevMissions: DailyMission[], type: DailyMission['type'], targetId: string | undefined, increment: number, currentDailyEarnings: number): { missions: DailyMission[], reward: number, allBonus: boolean } => {
    let extraMoney = 0;
    const nextMissions = prevMissions.map(mission => {
      if (mission.isCleared) return mission;
      let nextVal = mission.type === 'earn_money' ? currentDailyEarnings : (mission.type === type && (!mission.targetId || mission.targetId === targetId) ? mission.currentValue + increment : mission.currentValue);
      const isNowCleared = nextVal >= mission.targetValue;
      if (isNowCleared && !mission.isCleared) {
        extraMoney += 50000;
        addLog(`ミッション達成: ${mission.description} (報酬: ¥50,000)`);
      }
      return { ...mission, currentValue: nextVal, isCleared: isNowCleared };
    });
    let allBonus = nextMissions.length > 0 && nextMissions.every(m => m.isCleared) && !nextMissions.every((m, i) => prevMissions[i].isCleared);
    if (allBonus) {
        addLog(`全ミッション達成ボーナス！ (報酬: ¥150,000) & フィーバータイム開始！`);
        extraMoney += 150000;
    }
    return { missions: nextMissions, reward: extraMoney, allBonus };
  };

  const buyIngredient = (type: IngredientType, amount: number = 1) => {
    const item = INGREDIENTS_DATA[type];
    const costModifier = dailyEvent?.costModifier || 1.0;
    const unitCost = Math.floor(item.cost * costModifier);
    
    setGameState(prev => {
      const currentStock = prev.ingredients[type];
      const limit = prev.ingredientLimits[type];
      const possibleAmount = Math.min(amount, limit - currentStock);
      
      if (possibleAmount <= 0) {
        addLog(`仕入れ不可: ${item.name} は在庫上限 (${limit}${item.unit}) に達しています`);
        return prev;
      }

      const totalCost = unitCost * possibleAmount;
      if (prev.money < totalCost) {
        addLog(`資金不足: ${item.name} ${possibleAmount}個 分の資金が足りません`);
        return prev;
      }

      const { missions, reward, allBonus } = processMissionUpdates(prev.currentMissions, 'buy_ingredient', type, possibleAmount, prev.dailyEarnings);
      addLog(`仕入れ: ${item.name} を${possibleAmount}${item.unit}購入しました (-¥${totalCost.toLocaleString()})`);
      return {
        ...prev,
        money: prev.money - totalCost + reward,
        ingredients: { ...prev.ingredients, [type]: currentStock + possibleAmount },
        currentMissions: missions,
        allMissionsBonusClaimed: prev.allMissionsBonusClaimed || allBonus,
        isFeverMode: prev.isFeverMode || allBonus,
        feverEndTime: allBonus ? Date.now() + 180000 : prev.feverEndTime
      };
    });
  };

  const restockAllToLimit = () => {
    setGameState(prev => {
      let totalCost = 0;
      const newIngredients = { ...prev.ingredients };
      const costModifier = dailyEvent?.costModifier || 1.0;
      let purchasedCount = 0;

      Object.values(IngredientType).forEach(type => {
        const item = INGREDIENTS_DATA[type];
        const limit = prev.ingredientLimits[type];
        const current = prev.ingredients[type];
        const need = Math.max(0, limit - current);
        if (need > 0) {
          const cost = Math.floor(item.cost * costModifier) * need;
          if (prev.money >= totalCost + cost) {
            totalCost += cost;
            newIngredients[type] += need;
            purchasedCount++;
          }
        }
      });

      if (purchasedCount === 0) {
        addLog("一括仕入れ: 補充が必要な材料がないか、資金が足りません");
        return prev;
      }

      addLog(`一括仕入れ: 全材料を上限まで補充しました (-¥${totalCost.toLocaleString()})`);
      return { ...prev, money: prev.money - totalCost, ingredients: newIngredients };
    });
  };

  const updateLimit = (type: IngredientType, delta: number) => {
    setGameState(prev => ({
      ...prev,
      ingredientLimits: {
        ...prev.ingredientLimits,
        [type]: Math.max(0, prev.ingredientLimits[type] + delta)
      }
    }));
  };

  const buyUpgrade = (key: keyof UpgradeStats, cost: number) => {
    if (gameState.money >= cost) {
      setGameState(prev => ({ ...prev, money: prev.money - cost, upgrades: { ...prev.upgrades, [key]: prev.upgrades[key] + 1 } }));
      addLog(`設備投資: ${UPGRADES_DATA[key].name} を購入しました (-¥${cost.toLocaleString()})`);
    }
  };

  const handleLevelUp = () => {
    setGameState(prev => {
      const nextLevel = prev.shopLevel + 1;
      const bonusMoney = nextLevel * 50000;
      addLog(`RANK UP!: お店がランク${nextLevel}になりました！ お祝い金 ¥${bonusMoney.toLocaleString()} 獲得！`);
      
      // Fully restock all ingredients as a reward
      const restockedIngredients = { ...prev.ingredients };
      Object.keys(prev.ingredients).forEach(key => {
        const ingType = key as IngredientType;
        restockedIngredients[ingType] = prev.ingredientLimits[ingType];
      });
      addLog(`ランクアップ特典: 全材料を上限まで補充しました！`);

      return {
        ...prev,
        shopLevel: nextLevel,
        levelProgressSales: 0,
        money: prev.money + bonusMoney,
        ingredients: restockedIngredients
      };
    });
  };

  const startBaking = (breadType: BreadType, isAuto = false) => {
    let canBake = true;
    setGameState(prev => {
      if (prev.bakingStatus[breadType] !== null) { canBake = false; return prev; }
      const recipe = RECIPES[breadType];
      for (const [ingKey, amount] of Object.entries(recipe.ingredients)) {
          const key = ingKey as IngredientType;
          if ((prev.ingredients[key] || 0) < (amount || 0)) {
              if (!isAuto) addLog(`材料不足: ${recipe.name} 用の ${INGREDIENTS_DATA[key].name} が足りません`);
              canBake = false; return prev;
          }
      }
      const newIngredients = { ...prev.ingredients };
      for (const [ingKey, amount] of Object.entries(recipe.ingredients)) { newIngredients[ingKey as IngredientType] -= (amount || 0); }
      return { ...prev, ingredients: newIngredients, bakingStatus: { ...prev.bakingStatus, [breadType]: 0 } };
    });
    if (canBake) addLog(`${isAuto ? 'スタッフ代行' : '調理開始'}: ${RECIPES[breadType].name} を焼き始めました`);
    return canBake;
  };

  useEffect(() => {
    const automationInterval = setInterval(() => {
      // FIX: Explicitly cast to number to ensure 'staff' value is not treated as unknown
      const staffVal = gameState.upgrades.staff as number;
      if (staffVal <= 0) return;
      
      const currentBakingCount = Object.values(gameState.bakingStatus).filter(s => s !== null).length;
      // FIX: Ensure availableStaff is calculated and checked as a number
      const availableStaff = staffVal - currentBakingCount;
      if (availableStaff <= 0) return;
      
      const lowStockBreads = Object.values(BreadType).filter(type => {
        const recipe = RECIPES[type];
        return recipe.levelRequired <= gameState.shopLevel && gameState.inventory[type] < 5 && gameState.bakingStatus[type] === null;
      });
      lowStockBreads.slice(0, availableStaff).forEach(breadType => startBaking(breadType, true));
    }, 2000);
    return () => clearInterval(automationInterval);
  }, [gameState.upgrades.staff, gameState.inventory, gameState.bakingStatus, gameState.shopLevel]);

  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => {
        const nextBakingStatus = { ...prev.bakingStatus };
        const nextInventory = { ...prev.inventory };
        let bakedType: BreadType | null = null;
        let bakedCount = 0;
        let changed = false;
        Object.keys(nextBakingStatus).forEach((key) => {
          const breadType = key as BreadType;
          const progress = nextBakingStatus[breadType];
          if (progress !== null) {
            const recipe = RECIPES[breadType];
            const speedMultiplier = Math.pow(0.95, prev.upgrades.speed);
            const increment = 100 / (Math.max(0.1, recipe.bakeTimeSec * speedMultiplier) * 10);
            const newProgress = progress + increment;
            if (newProgress >= 100) {
              nextBakingStatus[breadType] = null;
              const totalAmount = recipe.batchSize + prev.upgrades.batch;
              nextInventory[breadType] += totalAmount;
              bakedCount = totalAmount; bakedType = breadType;
              addLog(`焼き上がり: ${recipe.name} が ${totalAmount}個 完成！`);
            } else { nextBakingStatus[breadType] = newProgress; }
            changed = true;
          }
        });
        if (changed) {
            let nextMissions = prev.currentMissions;
            let totalReward = 0;
            let finalAllBonus = prev.allMissionsBonusClaimed;
            if (bakedType) {
                const { missions, reward, allBonus } = processMissionUpdates(nextMissions, 'bake_bread', bakedType, bakedCount, prev.dailyEarnings);
                nextMissions = missions; totalReward += reward; if (allBonus) finalAllBonus = true;
            }
            return { 
              ...prev, 
              bakingStatus: nextBakingStatus, 
              inventory: nextInventory, 
              currentMissions: nextMissions, 
              money: prev.money + totalReward, 
              allMissionsBonusClaimed: finalAllBonus,
              isFeverMode: prev.isFeverMode || finalAllBonus,
              feverEndTime: (finalAllBonus && !prev.allMissionsBonusClaimed) ? Date.now() + 180000 : prev.feverEndTime
            };
        }
        return prev;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!gameState.isShopOpen) return;
    const sellInterval = setInterval(() => {
      setGameState(prev => {
        const numBranches = prev.upgrades.branches;
        let moneyEarned = 0;
        let totalProgressGained = 0;
        let lastSoldBread: BreadType | null = null;
        const currentInventory = { ...prev.inventory };
        const soldHistory: {type: BreadType, count: number}[] = [];
        
        // Base progress multiplier
        const brandMultiplier = 1 + (prev.upgrades.brand * 0.2);
        const reputationBonus = 1 + (prev.reputation / 1000); // Max ~1.1x at 100 rep

        for (let i = 0; i < numBranches; i++) {
            const availableBreads = (Object.keys(currentInventory) as BreadType[]).filter(k => currentInventory[k] > 0);
            if (availableBreads.length === 0) continue; 
            const breadToSell = availableBreads[Math.floor(Math.random() * availableBreads.length)];
            const recipe = RECIPES[breadToSell];
            let sellChance = (0.3 + (prev.reputation / 200)) * (1 + (prev.upgrades.promo * 0.05));
            if (dailyEvent) { sellChance *= dailyEvent.salesModifier; if (dailyEvent.trend === breadToSell) sellChance *= 1.5; }
            if (prev.isFeverMode) { sellChance *= 1.5; }
            
            if (Math.random() < sellChance) {
                let price = recipe.basePrice;
                if (Math.random() < Math.min(0.8, prev.upgrades.eatIn * 0.02)) price = Math.floor(price * 1.5);
                
                // Calculate level progress bonus
                const isTrend = dailyEvent?.trend === breadToSell;
                const progressForThisSale = (isTrend ? 2 : 1) * brandMultiplier * reputationBonus;
                
                moneyEarned += price;
                totalProgressGained += progressForThisSale;
                currentInventory[breadToSell] -= 1;
                lastSoldBread = breadToSell;
                
                const existing = soldHistory.find(sb => sb.type === breadToSell);
                if (existing) existing.count++; else soldHistory.push({type: breadToSell, count: 1});
            }
        }
        if (moneyEarned === 0) return prev;
        const nextDailyEarnings = prev.dailyEarnings + moneyEarned;
        let { missions: nextMissions, reward: totalReward, allBonus } = processMissionUpdates(prev.currentMissions, 'earn_money', undefined, 0, nextDailyEarnings);
        soldHistory.forEach(sh => {
            const result = processMissionUpdates(nextMissions, 'sell_bread', sh.type, sh.count, nextDailyEarnings);
            nextMissions = result.missions; totalReward += result.reward; if (result.allBonus) allBonus = true;
        });
        if (lastSoldBread) setLastSale({ id: Date.now() + Math.random(), bread: lastSoldBread, timestamp: Date.now() });
        return { 
          ...prev, 
          money: prev.money + moneyEarned + totalReward, 
          dailyEarnings: nextDailyEarnings, 
          reputation: prev.reputation + 0.1, 
          levelProgressSales: prev.levelProgressSales + totalProgressGained, 
          inventory: currentInventory, 
          currentMissions: nextMissions, 
          allMissionsBonusClaimed: prev.allMissionsBonusClaimed || allBonus,
          isFeverMode: prev.isFeverMode || allBonus,
          feverEndTime: (allBonus && !prev.allMissionsBonusClaimed) ? Date.now() + 180000 : prev.feverEndTime
        };
      });
    }, 1000); 
    return () => clearInterval(sellInterval);
  }, [gameState.isShopOpen, dailyEvent]);

  const prepareDay = async (targetDay: number) => {
    setLoadingDaily(true);
    const wages = gameState.upgrades.staff * DAILY_WAGE_PER_STAFF;
    if (wages > 0) addLog(`経費支払い: アルバイト ${gameState.upgrades.staff}人分の給与 ¥${wages.toLocaleString()} を支払いました`);
    setGameState(prev => ({ ...prev, isShopOpen: false, allMissionsBonusClaimed: false, dailyEarnings: 0, money: prev.money - wages }));
    const report = await generateDailyReport(targetDay, gameState.shopLevel);
    setDailyEvent(report);
    setGameState(prev => ({ ...prev, day: targetDay, currentMissions: report.missions }));
    setLoadingDaily(false);
  };

  const startNextDay = () => prepareDay(gameState.day + 1);
  const openShop = () => { setGameState(prev => ({ ...prev, isShopOpen: true })); setDailyEvent(null); addLog("開店: お店をオープンしました！"); };
  const closeShopEarly = () => { 
    setGameState(prev => ({ ...prev, isShopOpen: false, isFeverMode: false, feverEndTime: null })); 
    addLog("閉店: 本日の営業を終了しました。"); 
    if (user) saveGameState(user.uid, gameState);
  };

  useEffect(() => {
    if (!gameState.isFeverMode || !gameState.feverEndTime) return;
    const interval = setInterval(() => {
      if (Date.now() >= (gameState.feverEndTime || 0)) {
        setGameState(prev => ({ ...prev, isFeverMode: false, feverEndTime: null }));
        addLog("フィーバータイムが終了しました。");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.isFeverMode, gameState.feverEndTime]);

  useEffect(() => { if (gameState.day === 1 && !dailyEvent && !gameState.isShopOpen && !authLoading) prepareDay(1); }, [authLoading]);

  const progressPercent = Math.min(100, (gameState.levelProgressSales / getLevelUpThreshold(gameState.shopLevel)) * 100);
  const totalBrandMultiplier = (1 + (gameState.upgrades.brand * 0.2)).toFixed(1);

  const cameras = [
    { name: "CAM 01: FRONT", pos: [0, 5, 8] as [number, number, number], fov: 45 },
    { name: "CAM 02: SIDE", pos: [8, 4, 3] as [number, number, number], fov: 50 },
    { name: "CAM 03: TOP", pos: [0, 12, 1] as [number, number, number], fov: 40 },
    { name: "CAM 04: EAT-IN", pos: [-6, 6, 8] as [number, number, number], fov: 55 },
  ];

  return (
    <div className="min-h-screen pb-12 bg-[#fdf6e3]">
      {authLoading && (
        <div className="fixed inset-0 z-50 bg-[#fdf6e3] flex flex-col items-center justify-center">
            <Wheat className="w-16 h-16 text-amber-500 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-amber-800">認証中...</h2>
        </div>
      )}

      {!user && !authLoading && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-amber-200">
            <div className="bg-amber-500 w-20 h-20 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
              <Store className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-amber-900 mb-2 font-maru">小麦の詩</h2>
            <p className="text-amber-800/70 mb-8 text-sm">
              あなただけのベーカリーをクラウドに保存。<br/>
              どこからでも続きをプレイできます。
            </p>
            <button 
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-stone-200 hover:border-amber-400 py-3 rounded-xl font-bold text-stone-700 transition-all active:scale-95 group shadow-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              Googleでログイン
            </button>
          </div>
        </div>
      )}

      {loadingDaily && (
        <div className="fixed inset-0 z-50 bg-[#fdf6e3] flex flex-col items-center justify-center">
            <div className="mb-4 relative">
              <Wheat className="w-20 h-20 text-amber-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-amber-900 font-bold text-lg">{gameState.isShopOpen || gameState.day > 1 ? gameState.day + 1 : 1}</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-amber-800 text-center">
              {gameState.isShopOpen || gameState.day > 1 ? gameState.day + 1 : 1}日目の準備中...
              <br/>
              <span className="text-sm font-normal text-amber-600 tracking-widest">ANALYZING TRENDS</span>
            </h2>
        </div>
      )}
      {dailyEvent && !loadingDaily && <DailyModal event={dailyEvent} onClose={openShop} />}
      {showUpgrades && <UpgradeModal currentMoney={gameState.money} upgrades={gameState.upgrades} onBuy={buyUpgrade} onClose={() => setShowUpgrades(false)} />}

      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-amber-200 shadow-sm px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg text-white shadow-sm transition-colors duration-500 ${gameState.isFeverMode ? 'bg-gradient-to-br from-red-500 via-orange-400 to-yellow-500 animate-pulse' : 'bg-amber-500'}`}>
                  <Store className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h1 className="font-bold text-amber-900 leading-tight text-xs sm:text-lg text-nowrap flex items-center gap-2">
                    小麦の詩
                    {gameState.isFeverMode && (
                      <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-bounce shadow-orange-500 shadow-sm">FEVER!!</span>
                    )}
                  </h1>
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex flex-col items-center bg-amber-100 px-4 py-1 rounded-xl border border-amber-200 shadow-inner">
                  <span className="text-[8px] text-amber-600 font-bold uppercase tracking-tighter">Current Day</span>
                  <div className="text-amber-900 text-sm sm:text-base font-black tracking-tighter leading-none">{gameState.day}<span className="text-[10px] ml-0.5">日目</span></div>
                </div>
                <div className="flex flex-col items-end">
                    <div className="text-amber-800 text-xs sm:text-sm font-bold">¥{gameState.money.toLocaleString()}</div>
                </div>
                <button onClick={() => setShowUpgrades(true)} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg transition-all active:scale-90"><Hammer className="w-4 h-4" /></button>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
            <section className="bg-white rounded-2xl shadow-sm border border-amber-100 p-5">
                <h2 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2"><ChefHat className="w-5 h-5 text-amber-600" />工房</h2>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                    {Object.values(RECIPES).filter(r => r.levelRequired <= gameState.shopLevel).map(recipe => (
                        <div key={recipe.id} className="border border-stone-200 rounded-xl p-4 bg-stone-50 hover:border-amber-200 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-stone-800 text-sm">{recipe.name}</h3>
                                <div className="bg-amber-100 px-2 py-0.5 rounded text-[10px] font-bold text-amber-700">在庫: {gameState.inventory[recipe.id]}</div>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-3">
                                {Object.entries(recipe.ingredients).map(([ing, amount]) => (
                                    <span key={ing} className={`text-[9px] px-1.5 py-0.5 rounded ${gameState.ingredients[ing as IngredientType] < (amount || 0) ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                        {INGREDIENTS_DATA[ing as IngredientType].name} x{amount}
                                    </span>
                                ))}
                            </div>
                            {gameState.bakingStatus[recipe.id] !== null ? (
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden"><div className="bg-amber-500 h-full relative" style={{ width: `${gameState.bakingStatus[recipe.id]}%` }}><div className="absolute inset-0 bg-white/20 animate-pulse"></div></div></div>
                            ) : (
                                <button onClick={() => startBaking(recipe.id)} className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs shadow-sm">パンを焼く</button>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-amber-100 p-5">
                <h2 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-amber-600" />ショーケース（在庫状況）</h2>
                <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.entries(gameState.inventory).map(([type, count]) => {
                    if (count <= 0) return null;
                    const bread = RECIPES[type as BreadType];
                    return (
                      <div key={type} className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex flex-col items-center text-center transition-all hover:shadow-md">
                        <span className="text-[10px] font-bold text-orange-800 mb-1 leading-tight">{bread.name}</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-orange-900">{count}</span>
                          <span className="text-[10px] text-orange-600">個</span>
                        </div>
                      </div>
                    );
                  })}
                  {Object.values(gameState.inventory).every(c => c === 0) && (
                    <div className="col-span-2 py-8 text-center text-stone-400 text-xs italic">
                      現在、在庫はありません。<br/>パンを焼きましょう！
                    </div>
                  )}
                </div>
            </section>
        </div>

        <div className="space-y-6">
            <section className="bg-stone-900 rounded-2xl shadow-2xl border-4 border-stone-800 p-1 relative">
                <div className="absolute top-4 right-4 z-20 bg-amber-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg font-black text-sm shadow-xl border border-amber-400 pointer-events-none">
                  DAY {gameState.day}
                </div>
                <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-xl">
                    {cameras.map((cam, idx) => (
                        <div key={idx} className="relative h-40 md:h-48 bg-black border border-stone-800 overflow-hidden">
                            <div className="absolute top-1 left-1 z-10 flex flex-col gap-0.5 pointer-events-none">
                                <span className="bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded font-mono uppercase tracking-tighter">{cam.name}</span>
                                {gameState.isShopOpen && <div className="flex items-center gap-1 bg-red-600/40 px-1.5 py-0.5 rounded"><div className="w-1 h-1 rounded-full bg-red-500 animate-pulse"></div><span className="text-white text-[7px] font-bold font-mono">LIVE</span></div>}
                            </div>
                            <Bakery3DScene lastSale={lastSale} inventory={gameState.inventory} eatInLevel={gameState.upgrades.eatIn} staffCount={gameState.upgrades.staff} cameraPosition={cam.pos} cameraFov={cam.fov}/>
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-amber-200 p-5 relative">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-amber-600" /> 目標</h2>
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span className="text-[9px] font-bold text-amber-700">進捗 x{totalBrandMultiplier}</span>
                  </div>
                </div>
                <div className="space-y-3">
                    {gameState.currentMissions.map(m => (
                        <div key={m.id} className={`p-3 rounded-xl border transition-all ${m.isCleared ? 'bg-green-50 border-green-200' : 'bg-stone-50 border-stone-100'}`}>
                            <div className="flex justify-between items-center mb-1">
                                <span className={`text-[10px] font-bold ${m.isCleared ? 'text-green-700' : 'text-stone-700'}`}>{m.description}</span>
                                {m.isCleared && <Zap className="w-3 h-3 text-green-500 fill-green-500" />}
                            </div>
                            <div className="w-full bg-stone-200 rounded-full h-1 overflow-hidden">
                                <div className={`h-full ${m.isCleared ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, (m.currentValue / m.targetValue) * 100)}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t border-amber-100">
                    <div className="flex justify-between items-center mb-1"><h3 className="text-[10px] font-bold text-amber-800">RANK: {gameState.shopLevel}</h3><span className="text-[10px] text-stone-400">進捗: {Math.floor(gameState.levelProgressSales)} / {getLevelUpThreshold(gameState.shopLevel)} pt</span></div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2"><div className="bg-orange-500 h-full rounded-full transition-all duration-500 shadow-[0_0_5px_rgba(249,115,22,0.5)]" style={{ width: `${progressPercent}%` }}></div></div>
                    {gameState.levelProgressSales >= getLevelUpThreshold(gameState.shopLevel) && (
                        <button onClick={handleLevelUp} className="w-full py-1.5 bg-orange-500 text-white text-[10px] font-bold rounded shadow-lg animate-bounce">ランクアップ可能！</button>
                    )}
                </div>
                <div className="mt-4 flex flex-col gap-2">
                    {gameState.isShopOpen ? (
                        <button onClick={closeShopEarly} className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs border border-red-200">営業終了</button>
                    ) : (
                        <button onClick={startNextDay} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all active:scale-95">翌日の準備へ <Sun className="w-4 h-4" /></button>
                    )}
                </div>
            </section>
        </div>

        <div className="space-y-6">
            <section className="bg-white rounded-2xl shadow-sm border border-amber-100 p-5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2"><Store className="w-5 h-5 text-amber-600" />パントリー</h2>
                  <button onClick={restockAllToLimit} className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold px-2 py-1 rounded-lg border border-amber-200 transition-colors">
                    上限まで一括仕入れ
                  </button>
                </div>
                <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                    {Object.values(INGREDIENTS_DATA).map(item => {
                        const current = gameState.ingredients[item.id];
                        const limit = gameState.ingredientLimits[item.id];
                        const progress = Math.min(100, (current / limit) * 100);
                        const unitCost = Math.floor(item.cost * (dailyEvent?.costModifier || 1.0));
                        const isFull = current >= limit;
                        
                        return (
                            <div key={item.id} className="p-3 border border-stone-100 rounded-xl bg-stone-50/50">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <div className="font-bold text-stone-700 text-xs">{item.name}</div>
                                      <div className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isFull ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {current} / {limit}{item.unit}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => updateLimit(item.id, -50)} className="w-5 h-5 bg-white border border-stone-200 text-[10px] flex items-center justify-center rounded text-stone-500 hover:bg-stone-100">-</button>
                                      <div className="text-[9px] font-bold text-stone-400">上限</div>
                                      <button onClick={() => updateLimit(item.id, 50)} className="w-5 h-5 bg-white border border-stone-200 text-[10px] flex items-center justify-center rounded text-stone-500 hover:bg-stone-100">+</button>
                                    </div>
                                </div>
                                <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden mb-2">
                                  <div className={`h-full transition-all duration-500 ${isFull ? 'bg-orange-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {[1, 10, 50].map(amount => (
                                        <button 
                                          key={amount} 
                                          onClick={() => buyIngredient(item.id, amount)} 
                                          disabled={isFull || gameState.money < (unitCost * amount)} 
                                          className={`py-1 rounded text-[9px] font-bold flex flex-col items-center border transition-all 
                                            ${!isFull && gameState.money >= (unitCost * amount) 
                                              ? 'bg-white text-stone-700 border-stone-200 hover:bg-amber-50 active:scale-95' 
                                              : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'}`}
                                        >
                                            <span className="opacity-60">x{amount}</span>
                                            <span>¥{(unitCost * amount).toLocaleString()}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
      </main>
    </div>
  );
};

export default App;
