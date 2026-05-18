export enum IngredientType {
  FLOUR = 'flour',
  SUGAR = 'sugar',
  BUTTER = 'butter',
  YEAST = 'yeast',
  MILK = 'milk',
  EGGS = 'eggs',
  SALT = 'salt',
  CHOCO = 'choco',
  ANKO = 'anko',
  CURRY = 'curry',
  VEGETABLES = 'vegetables',
  MEAT = 'meat',
  FISH = 'fish'
}

export enum BreadType {
  SHOKUPAN = 'shokupan',
  ANPAN = 'anpan',
  CREAMPAN = 'creampan',
  SHIOPAN = 'shiopan',
  MELONPAN = 'melonpan',
  CURRYPAN = 'currypan',
  CORNET = 'cornet',
  BAGUETTE = 'baguette',
  BAGEL = 'bagel',
  EPI = 'epi',
  CROISSANT = 'croissant',
  CINNAMON = 'cinnamon',
  FOCACCIA = 'focaccia',
  PRETZEL = 'pretzel',
  DANISH = 'danish',
  BRIOCHE = 'brioche',
  RYE = 'rye',
  SOURDOUGH = 'sourdough',
  PANETTONE = 'panettone',
  SANDWICH = 'sandwich',
  TUNAPAN = 'tunapan',
  MEATPIE = 'meatpie'
}

export interface DailyMission {
  id: string;
  description: string;
  targetValue: number;
  currentValue: number;
  type: 'sell_bread' | 'bake_bread' | 'earn_money' | 'buy_ingredient';
  targetId?: string; // BreadType or IngredientType
  isCleared: boolean;
}

export interface Ingredient {
  id: IngredientType;
  name: string;
  cost: number;
  stock: number;
  unit: string;
}

export interface BreadRecipe {
  id: BreadType;
  name: string;
  description: string;
  basePrice: number;
  ingredients: { [key in IngredientType]?: number };
  batchSize: number;
  levelRequired: number;
  bakeTimeSec: number;
}

export interface DailyEvent {
  day: number;
  weather: string;
  trend: BreadType | null;
  trendReason: string;
  customerSentiment: string;
  salesModifier: number;
  costModifier: number;
  missions: DailyMission[];
}

export interface UpgradeStats {
  speed: number;
  batch: number;
  promo: number;
  branches: number;
  eatIn: number;
  staff: number;
  brand: number; // New: Brand power for faster leveling
}

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  breadType?: BreadType;
  date: number;
}

export interface GameState {
  money: number;
  day: number;
  dailyEarnings: number;
  reputation: number;
  shopLevel: number;
  levelProgressSales: number;
  ingredients: Record<IngredientType, number>;
  ingredientLimits: Record<IngredientType, number>; // New: Inventory limits
  inventory: Record<BreadType, number>;
  isShopOpen: boolean;
  bakingStatus: Record<BreadType, number | null>;
  upgrades: UpgradeStats;
  currentMissions: DailyMission[];
  allMissionsBonusClaimed: boolean;
  isFeverMode: boolean;
  feverEndTime: number | null;
  reviews: Review[];
  latestReviews: Review[];
  currentDayOpenTime: number; // New: Total time shop was open this day (ms)
  lastOpenTimestamp: number | null; // New: When the shop was last opened
  discoveredBreads: BreadType[];
  customPrices: Record<BreadType, number>;
}