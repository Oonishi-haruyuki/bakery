import { BreadType, IngredientType, BreadRecipe, Ingredient } from './types';

export const INITIAL_MONEY = 100000;
export const MAX_SHOP_LEVEL = 50;
export const WAGE_PER_15_MIN_PER_STAFF = 1250; // 1人あたりの15分ごとの給与

// Calculate sales count needed to reach the NEXT level from current level
export const getLevelUpThreshold = (currentLevel: number): number => {
  if (currentLevel >= MAX_SHOP_LEVEL) return Infinity;
  return Math.floor(20 * currentLevel + Math.pow(currentLevel, 2.5) * 5);
};

export const INGREDIENTS_DATA: Record<IngredientType, Ingredient> = {
  [IngredientType.FLOUR]: { id: IngredientType.FLOUR, name: '強力粉', cost: 150, stock: 0, unit: 'kg' },
  [IngredientType.SUGAR]: { id: IngredientType.SUGAR, name: '砂糖', cost: 200, stock: 0, unit: 'kg' },
  [IngredientType.BUTTER]: { id: IngredientType.BUTTER, name: '高級バター', cost: 450, stock: 0, unit: 'kg' },
  [IngredientType.YEAST]: { id: IngredientType.YEAST, name: '天然酵母', cost: 300, stock: 0, unit: 'パック' },
  [IngredientType.MILK]: { id: IngredientType.MILK, name: '新鮮な牛乳', cost: 120, stock: 0, unit: 'L' },
  [IngredientType.EGGS]: { id: IngredientType.EGGS, name: 'こだわり卵', cost: 250, stock: 0, unit: 'パック' },
  [IngredientType.SALT]: { id: IngredientType.SALT, name: '海塩', cost: 80, stock: 0, unit: 'kg' },
  [IngredientType.CHOCO]: { id: IngredientType.CHOCO, name: 'カカオチョコ', cost: 500, stock: 0, unit: 'kg' },
  [IngredientType.ANKO]: { id: IngredientType.ANKO, name: 'つぶあん', cost: 350, stock: 0, unit: 'kg' },
  [IngredientType.CURRY]: { id: IngredientType.CURRY, name: 'スパイシーカレー', cost: 400, stock: 0, unit: 'kg' },
  [IngredientType.VEGETABLES]: { id: IngredientType.VEGETABLES, name: '新鮮野菜', cost: 280, stock: 0, unit: 'kg' },
  [IngredientType.MEAT]: { id: IngredientType.MEAT, name: '厳選精肉', cost: 650, stock: 0, unit: 'kg' },
  [IngredientType.FISH]: { id: IngredientType.FISH, name: '旬の鮮魚', cost: 580, stock: 0, unit: 'kg' },
};

export const RECIPES: Record<BreadType, BreadRecipe> = {
  // Lv 1
  [BreadType.SHOKUPAN]: {
    id: BreadType.SHOKUPAN,
    name: '特製食パン',
    description: 'ふわふわもちもち、毎日の食卓に。',
    basePrice: 300,
    ingredients: { [IngredientType.FLOUR]: 2, [IngredientType.SUGAR]: 1, [IngredientType.YEAST]: 1, [IngredientType.MILK]: 1 },
    batchSize: 5,
    levelRequired: 1,
    bakeTimeSec: 3,
  },
  [BreadType.ANPAN]: {
    id: BreadType.ANPAN,
    name: '懐かしのあんパン',
    description: '北海道産小豆をたっぷり包みました。',
    basePrice: 220,
    ingredients: { [IngredientType.FLOUR]: 1, [IngredientType.SUGAR]: 1, [IngredientType.YEAST]: 1, [IngredientType.ANKO]: 2 },
    batchSize: 6,
    levelRequired: 1,
    bakeTimeSec: 4,
  },

  // Lv 2
  [BreadType.CREAMPAN]: {
    id: BreadType.CREAMPAN,
    name: '極上クリームパン',
    description: 'バニラ香るカスタードが自慢。',
    basePrice: 240,
    ingredients: { [IngredientType.FLOUR]: 1, [IngredientType.MILK]: 2, [IngredientType.EGGS]: 2, [IngredientType.SUGAR]: 1 },
    batchSize: 6,
    levelRequired: 2,
    bakeTimeSec: 4,
  },
  [BreadType.SHIOPAN]: {
    id: BreadType.SHIOPAN,
    name: '塩バターロール',
    description: 'ジュワッと広がるバターと岩塩のアクセント。',
    basePrice: 180,
    ingredients: { [IngredientType.FLOUR]: 1, [IngredientType.BUTTER]: 1, [IngredientType.SALT]: 1, [IngredientType.YEAST]: 1 },
    batchSize: 8,
    levelRequired: 2,
    bakeTimeSec: 3,
  },
  [BreadType.MELONPAN]: {
    id: BreadType.MELONPAN,
    name: 'サクふわメロンパン',
    description: '甘い クッキー生地が絶品。子供に人気。',
    basePrice: 180,
    ingredients: { [IngredientType.FLOUR]: 1, [IngredientType.SUGAR]: 2, [IngredientType.BUTTER]: 1, [IngredientType.EGGS]: 1 },
    batchSize: 8,
    levelRequired: 2,
    bakeTimeSec: 5,
  },
  [BreadType.SANDWICH]: {
    id: BreadType.SANDWICH,
    name: 'ミックスサンド',
    description: '新鮮野菜とハムを贅沢に挟みました。',
    basePrice: 420,
    ingredients: { [IngredientType.FLOUR]: 1, [IngredientType.VEGETABLES]: 2, [IngredientType.MEAT]: 1, [IngredientType.EGGS]: 1 },
    batchSize: 4,
    levelRequired: 2,
    bakeTimeSec: 5,
  },
  [BreadType.TUNAPAN]: {
    id: BreadType.TUNAPAN,
    name: 'ツナマヨパン',
    description: 'お魚の旨味とマヨネーズが相性抜群。',
    basePrice: 260,
    ingredients: { [IngredientType.FLOUR]: 1, [IngredientType.FISH]: 1, [IngredientType.EGGS]: 1, [IngredientType.YEAST]: 1 },
    batchSize: 6,
    levelRequired: 2,
    bakeTimeSec: 4,
  },

  // Lv 3
  [BreadType.CURRYPAN]: {
    id: BreadType.CURRYPAN,
    name: '揚げカレーパン',
    description: 'お肉と野菜の旨味が溶け込んだスパイシーカレー。',
    basePrice: 380,
    ingredients: { [IngredientType.FLOUR]: 2, [IngredientType.CURRY]: 1, [IngredientType.MEAT]: 1, [IngredientType.VEGETABLES]: 1, [IngredientType.YEAST]: 1 },
    batchSize: 5,
    levelRequired: 3,
    bakeTimeSec: 6,
  },
  [BreadType.CORNET]: {
    id: BreadType.CORNET,
    name: 'チョココロネ',
    description: '巻貝の形をした愛らしいパン。',
    basePrice: 280,
    ingredients: { [IngredientType.FLOUR]: 1, [IngredientType.CHOCO]: 2, [IngredientType.MILK]: 1 },
    batchSize: 6,
    levelRequired: 3,
    bakeTimeSec: 5,
  },
  [BreadType.BAGUETTE]: {
    id: BreadType.BAGUETTE,
    name: '石窯バゲット',
    description: '外はカリッと、中は気泡たっぷり。',
    basePrice: 250,
    ingredients: { [IngredientType.FLOUR]: 3, [IngredientType.SALT]: 1, [IngredientType.YEAST]: 2 },
    batchSize: 6,
    levelRequired: 3,
    bakeTimeSec: 6,
  },

  // Lv 4
  [BreadType.BAGEL]: {
    id: BreadType.BAGEL,
    name: 'もちもちベーグル',
    description: '茹でてから焼くことで独特の食感に。',
    basePrice: 240,
    ingredients: { [IngredientType.FLOUR]: 2, [IngredientType.SUGAR]: 1, [IngredientType.YEAST]: 1, [IngredientType.SALT]: 1 },
    batchSize: 6,
    levelRequired: 4,
    bakeTimeSec: 5,
  },
  [BreadType.EPI]: {
    id: BreadType.EPI,
    name: 'ベーコンエピ',
    description: '麦の穂を模した、ジューシーなお肉のハードパン。',
    basePrice: 420,
    ingredients: { [IngredientType.FLOUR]: 2, [IngredientType.MEAT]: 2, [IngredientType.SALT]: 1, [IngredientType.YEAST]: 1 },
    batchSize: 5,
    levelRequired: 4,
    bakeTimeSec: 7,
  },
  [BreadType.CROISSANT]: {
    id: BreadType.CROISSANT,
    name: '黄金クロワッサン',
    description: 'バターを贅沢に使った何層もの生地。',
    basePrice: 280,
    ingredients: { [IngredientType.FLOUR]: 2, [IngredientType.BUTTER]: 3, [IngredientType.EGGS]: 1 },
    batchSize: 6,
    levelRequired: 4,
    bakeTimeSec: 8,
  },

  // Lv 5
  [BreadType.CINNAMON]: {
    id: BreadType.CINNAMON,
    name: 'シナモンロール',
    description: '甘いアイシングとシナモンの香り。',
    basePrice: 450,
    ingredients: { [IngredientType.FLOUR]: 2, [IngredientType.SUGAR]: 3, [IngredientType.BUTTER]: 1, [IngredientType.MILK]: 1 },
    batchSize: 6,
    levelRequired: 5,
    bakeTimeSec: 8,
  },
  [BreadType.FOCACCIA]: {
    id: BreadType.FOCACCIA,
    name: '彩り野菜のフォカッチャ',
    description: 'オリーブオイルと旬の野菜が香るイタリアンパン。',
    basePrice: 680,
    ingredients: { [IngredientType.FLOUR]: 3, [IngredientType.VEGETABLES]: 2, [IngredientType.BUTTER]: 1, [IngredientType.SALT]: 2 },
    batchSize: 4,
    levelRequired: 5,
    bakeTimeSec: 9,
  },

  // Lv 6
  [BreadType.PRETZEL]: {
    id: BreadType.PRETZEL,
    name: 'プレッツェル',
    description: 'ドイツ発祥。独特の結び目と塩気が特徴。',
    basePrice: 260,
    ingredients: { [IngredientType.FLOUR]: 2, [IngredientType.SALT]: 2, [IngredientType.YEAST]: 1 },
    batchSize: 8,
    levelRequired: 6,
    bakeTimeSec: 6,
  },
  [BreadType.DANISH]: {
    id: BreadType.DANISH,
    name: 'フルーツデニッシュ',
    description: '季節の果物を乗せたサクサク生地。',
    basePrice: 600,
    ingredients: { [IngredientType.FLOUR]: 2, [IngredientType.BUTTER]: 3, [IngredientType.EGGS]: 2, [IngredientType.SUGAR]: 2 },
    batchSize: 6,
    levelRequired: 6,
    bakeTimeSec: 10,
  },
  [BreadType.MEATPIE]: {
    id: BreadType.MEATPIE,
    name: '本格ミートパイ',
    description: 'サクサクのパイ生地にぎっしり詰まったお肉。',
    basePrice: 720,
    ingredients: { [IngredientType.FLOUR]: 2, [IngredientType.MEAT]: 3, [IngredientType.BUTTER]: 2, [IngredientType.VEGETABLES]: 1 },
    batchSize: 4,
    levelRequired: 6,
    bakeTimeSec: 12,
  },

  // Lv 7
  [BreadType.BRIOCHE]: {
    id: BreadType.BRIOCHE,
    name: '王様のブリオッシュ',
    description: '王冠の形をしたリッチなパン。',
    basePrice: 750,
    ingredients: { [IngredientType.FLOUR]: 2, [IngredientType.EGGS]: 4, [IngredientType.BUTTER]: 4, [IngredientType.SUGAR]: 2 },
    batchSize: 6,
    levelRequired: 7,
    bakeTimeSec: 12,
  },
  [BreadType.RYE]: {
    id: BreadType.RYE,
    name: 'ライ麦パン',
    description: 'ずっしりと重く、酸味が癖になる食事パン。',
    basePrice: 700,
    ingredients: { [IngredientType.FLOUR]: 4, [IngredientType.SALT]: 2, [IngredientType.YEAST]: 2 },
    batchSize: 3,
    levelRequired: 7,
    bakeTimeSec: 15,
  },

  // Lv 8
  [BreadType.SOURDOUGH]: {
    id: BreadType.SOURDOUGH,
    name: 'サワードゥ',
    description: '自家製酵母でじっくり発酵させた逸品。',
    basePrice: 900,
    ingredients: { [IngredientType.FLOUR]: 5, [IngredientType.SALT]: 2, [IngredientType.YEAST]: 1 },
    batchSize: 2,
    levelRequired: 8,
    bakeTimeSec: 20,
  },

  // Lv 9
  [BreadType.PANETTONE]: {
    id: BreadType.PANETTONE,
    name: 'パネトーネ',
    description: 'ドライフルーツたっぷり。特別な日のために。',
    basePrice: 1200,
    ingredients: { [IngredientType.FLOUR]: 3, [IngredientType.EGGS]: 3, [IngredientType.BUTTER]: 4, [IngredientType.SUGAR]: 4 },
    batchSize: 5,
    levelRequired: 9,
    bakeTimeSec: 25,
  },
};

export const UPGRADES_DATA = {
  speed: {
    id: 'speed',
    name: '高速オーブン',
    description: '焼成時間を短縮します (Lvごとに5%短縮)',
    baseCost: 2000,
    costMultiplier: 1.15,
    maxLevel: 100,
  },
  batch: {
    id: 'batch',
    name: '大型トレイ',
    description: '一度に焼ける数を増やします (Lvごとに+1個)',
    baseCost: 3000,
    costMultiplier: 1.2,
    maxLevel: 100,
  },
  promo: {
    id: 'promo',
    name: 'おしゃれな看板',
    description: '集客力が上がり、パンが売れやすくなります (Lvごとに5%UP)',
    baseCost: 1500,
    costMultiplier: 1.15,
    maxLevel: 100,
  },
  branches: {
    id: 'branches',
    name: '新規店舗展開',
    description: '別店舗を開業し、販売力を倍増させます (最大10店舗)',
    baseCost: 50000,
    costMultiplier: 2.0,
    maxLevel: 10,
  },
  eatIn: {
    id: 'eatIn',
    name: 'イートイン設備',
    description: '店内で食事する客が増えます(売値1.5倍) (Lvごとに率2%UP)',
    baseCost: 8000,
    costMultiplier: 1.2,
    maxLevel: 50,
  },
  staff: {
    id: 'staff',
    name: 'アルバイト採用',
    description: '在庫が少なくなったパンを自動で焼き始めます (最大5人)',
    baseCost: 15000,
    costMultiplier: 2.5,
    maxLevel: 5,
  },
  brand: {
    id: 'brand',
    name: '全国ブランド展開',
    description: 'お店の認知度を高め、ランクアップ効率を上げます (Lvごとに進捗+20%)',
    baseCost: 10000,
    costMultiplier: 1.5,
    maxLevel: 20,
  }
};