import { GoogleGenAI, Type } from "@google/genai";
import { DailyEvent, BreadType, DailyMission, Review } from '../types';

const FALLBACK_EVENT: DailyEvent = {
  day: 1,
  weather: '晴れ',
  trend: BreadType.SHOKUPAN,
  trendReason: 'テレビで食パン特集が放送されたため、需要が高まっています。',
  customerSentiment: '「いい匂いがする！」とお客さんは楽しそうです。',
  salesModifier: 1.2,
  costModifier: 1.0,
  missions: [
    { id: 'm1', description: '食パンを10個販売する', targetValue: 10, currentValue: 0, type: 'sell_bread', targetId: BreadType.SHOKUPAN, isCleared: false },
    { id: 'm2', description: 'パンを合計30個焼く', targetValue: 30, currentValue: 0, type: 'bake_bread', isCleared: false },
    { id: 'm3', description: '本日の売上10,000円達成', targetValue: 10000, currentValue: 0, type: 'earn_money', isCleared: false }
  ]
};

export const generateCustomerReviews = async (
  day: number,
  salesData: { breadType: BreadType; count: number }[],
  totalSales: number,
  weather: string,
  trend: BreadType | null
): Promise<Review[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return [
      { id: `rev-${day}-1`, customerName: '常連さん', rating: 5, comment: 'いつ食べても美味しいパンです！', date: day },
      { id: `rev-${day}-2`, customerName: 'パン好き', rating: 4, comment: '今日も焼きたてが買えて満足。', date: day }
    ];
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const breadInfo = salesData.map(s => `${s.breadType}: ${s.count}個`).join(', ');
    
    const prompt = `
      あなたはパン屋さんの「口コミ生成AI」です。
      ${day}日目の売上データに基づいて、お客さんの口コミを3件生成してください。
      
      状況:
      - 天気: ${weather}
      - 売れたパン: ${breadInfo}
      - 総売上: ¥${totalSales.toLocaleString()}
      - トレンド: ${trend || '特になし'}
      
      お客さんの口調や感想は多様にしてください（満足した人、少し不満な人、感動した人など）。
      パンの種類が売れていれば、そのパンに言及する口コミを優先してください。
      
      以下のJSON形式で出力してください。
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              customerName: { type: Type.STRING },
              rating: { type: Type.NUMBER },
              comment: { type: Type.STRING },
              breadType: { type: Type.STRING }
            },
            required: ["customerName", "rating", "comment"]
          }
        }
      }
    });

    const data = JSON.parse(response.text || "[]");
    return data.map((d: { customerName: string; rating: number; comment: string; breadType?: string }, i: number) => ({
      id: `rev-${day}-${i}`,
      customerName: d.customerName,
      rating: d.rating,
      comment: d.comment,
      breadType: d.breadType as BreadType,
      date: day
    }));

  } catch (error) {
    console.error("Gemini API Error (Reviews):", error);
    return [];
  }
};

export const generateDailyReport = async (day: number, currentLevel: number): Promise<DailyEvent> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return { ...FALLBACK_EVENT, day };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const breadTypes = Object.values(BreadType);
    
    const prompt = `
      あなたはパン屋さん経営シミュレーションゲームの「ゲームマスターAI」です。
      ${day}日目、店舗Lv.${currentLevel}の状況を生成してください。
      
      パンの種類リスト: ${breadTypes.join(', ')}
      
      以下のJSON形式で出力してください。
      売上補正倍率(salesModifier): 0.8 ~ 1.5
      仕入れ価格変動倍率(costModifier): 0.7 ~ 1.6
      
      また、今日挑戦する3つの「デイリーミッション」を生成してください。
      ミッションタイプ: sell_bread, bake_bread, earn_money, buy_ingredient
      targetIdにはパンIDや材料IDを入れてください。
      targetValueは店舗レベルに応じて、少し頑張れば達成できる値（例: Lv.1なら販売数10、Lv.10なら50など）にしてください。
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weather: { type: Type.STRING },
            trend: { type: Type.STRING },
            trendReason: { type: Type.STRING },
            customerSentiment: { type: Type.STRING },
            salesModifier: { type: Type.NUMBER },
            costModifier: { type: Type.NUMBER },
            missions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  targetValue: { type: Type.NUMBER },
                  type: { type: Type.STRING },
                  targetId: { type: Type.STRING }
                }
              }
            }
          },
          required: ["weather", "trendReason", "customerSentiment", "salesModifier", "costModifier", "missions"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");

    let validTrend: BreadType | null = null;
    if (data.trend && Object.values(BreadType).includes(data.trend as BreadType)) {
      validTrend = data.trend as BreadType;
    }

    const missions: DailyMission[] = (data.missions || []).map((m: { description: string; targetValue: number; type: DailyMission['type']; targetId?: string }, i: number) => ({
      id: `mission-${day}-${i}`,
      description: m.description,
      targetValue: m.targetValue,
      currentValue: 0,
      type: m.type,
      targetId: m.targetId,
      isCleared: false
    }));

    return {
      day: day,
      weather: data.weather || "晴れ",
      trend: validTrend,
      trendReason: data.trendReason || "今日は穏やかな一日です。",
      customerSentiment: data.customerSentiment || "お客さんは期待しています。",
      salesModifier: data.salesModifier || 1.0,
      costModifier: data.costModifier || 1.0,
      missions: missions.length === 3 ? missions : FALLBACK_EVENT.missions
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { ...FALLBACK_EVENT, day };
  }
};