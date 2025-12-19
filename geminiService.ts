
import { GoogleGenAI, Type } from "@google/genai";
import { MSDSData } from "./types";

const SYSTEM_PROMPT = `あなたは化学薬品管理の専門家です。MSDS（安全データシート）を解析し、工場掲示用の要約を作成してください。

## GHSピクトグラムの特定（最重要）:
文書内の「第2項：危険有害性の要約」にあるシンボル画像や記述を確認し、以下のコードを必ず特定してください。
- GHS-01: 爆発物 (Explosive)
- GHS-02: 引火性 (Flammable)
- GHS-03: 酸化性 (Oxidizing)
- GHS-04: 高圧ガス (Gas)
- GHS-05: 腐食性 (Corrosive)
- GHS-06: 毒性 (Toxic)
- GHS-07: 有害性・刺激性 (Harmful)
- GHS-08: 健康有害性 (Health Hazard)
- GHS-09: 環境有害性 (Environmental)

## 出力ルール:
1. 全ての項目を日本語(ja)、英語(en)、ベトナム語(vi)で作成してください。
2. 作業員が緊急時に「何をすべきか」が即座にわかる短い文章にしてください。
3. 電話番号などの個人情報は含めないでください。`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    basicInfo: {
      type: Type.OBJECT,
      properties: {
        productName: { type: Type.OBJECT, properties: { ja: {type: Type.STRING}, en: {type: Type.STRING}, vi: {type: Type.STRING} } },
        companyName: { type: Type.OBJECT, properties: { ja: {type: Type.STRING}, en: {type: Type.STRING}, vi: {type: Type.STRING} } },
      },
    },
    hazards: {
      type: Type.OBJECT,
      properties: {
        ghsClass: { type: Type.OBJECT, properties: { ja: {type: Type.STRING}, en: {type: Type.STRING}, vi: {type: Type.STRING} } },
        ghsPictograms: { type: Type.ARRAY, items: { type: Type.STRING } },
        hazardStatements: { type: Type.OBJECT, properties: { ja: {type: Type.STRING}, en: {type: Type.STRING}, vi: {type: Type.STRING} } },
        precautionaryStatements: { type: Type.OBJECT, properties: { ja: {type: Type.STRING}, en: {type: Type.STRING}, vi: {type: Type.STRING} } },
      },
    },
    composition: {
      type: Type.OBJECT,
      properties: {
        ingredients: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.OBJECT, properties: { ja: {type: Type.STRING}, en: {type: Type.STRING}, vi: {type: Type.STRING} } },
              concentration: { type: Type.STRING },
            },
          },
        },
      },
    },
    firstAid: {
      type: Type.OBJECT,
      properties: {
        inhaled: { type: Type.OBJECT, properties: { ja: {type: Type.STRING}, en: {type: Type.STRING}, vi: {type: Type.STRING} } },
        skin: { type: Type.OBJECT, properties: { ja: {type: Type.STRING}, en: {type: Type.STRING}, vi: {type: Type.STRING} } },
        eyes: { type: Type.OBJECT, properties: { ja: {type: Type.STRING}, en: {type: Type.STRING}, vi: {type: Type.STRING} } },
        swallowed: { type: Type.OBJECT, properties: { ja: {type: Type.STRING}, en: {type: Type.STRING}, vi: {type: Type.STRING} } },
      },
    },
    firefighting: {
      type: Type.OBJECT,
      properties: {
        extinguishingMedia: { type: Type.OBJECT, properties: { ja: {type: Type.STRING}, en: {type: Type.STRING}, vi: {type: Type.STRING} } },
        precautions: { type: Type.OBJECT, properties: { ja: {type: Type.STRING}, en: {type: Type.STRING}, vi: {type: Type.STRING} } },
      },
    },
    handlingStorage: {
      type: Type.OBJECT,
      properties: {
        handling: { type: Type.OBJECT, properties: { ja: {type: Type.STRING}, en: {type: Type.STRING}, vi: {type: Type.STRING} } },
        storage: { type: Type.OBJECT, properties: { ja: {type: Type.STRING}, en: {type: Type.STRING}, vi: {type: Type.STRING} } },
      },
    },
    disposal: {
      type: Type.OBJECT,
      properties: {
        method: { type: Type.OBJECT, properties: { ja: {type: Type.STRING}, en: {type: Type.STRING}, vi: {type: Type.STRING} } },
      },
    },
  },
};

export const analyzeMSDS = async (fileBase64: string, mimeType: string, customKey?: string): Promise<MSDSData> => {
  const apiKey = customKey || process.env.API_KEY || '';
  if (!apiKey) throw new Error("APIキーが設定されていません。");

  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: fileBase64,
            mimeType: mimeType,
          },
        },
        {
          text: "このMSDSを解析して要約してください。GHSコードを正確に特定してください。",
        },
      ],
    },
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.1,
    },
  });

  try {
    const text = response.text || '{}';
    return JSON.parse(text) as MSDSData;
  } catch (error) {
    throw new Error("解析データの処理に失敗しました。キーが有効か確認してください。");
  }
};
