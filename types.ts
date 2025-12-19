
export enum Language {
  JA = 'ja',
  EN = 'en',
  VI = 'vi'
}

export interface MultilingualText {
  ja: string;
  en: string;
  vi: string;
}

export interface Ingredient {
  name: MultilingualText;
  concentration: string;
}

export interface MSDSData {
  basicInfo: {
    productName: MultilingualText;
    companyName: MultilingualText;
  };
  hazards: {
    ghsClass: MultilingualText;
    ghsPictograms: string[]; // ['GHS-01', 'GHS-02', ...]
    hazardStatements: MultilingualText;
    precautionaryStatements: MultilingualText;
  };
  composition: {
    ingredients: Ingredient[];
  };
  firstAid: {
    inhaled: MultilingualText;
    skin: MultilingualText;
    eyes: MultilingualText;
    swallowed: MultilingualText;
  };
  firefighting: {
    extinguishingMedia: MultilingualText;
    precautions: MultilingualText;
  };
  handlingStorage: {
    handling: MultilingualText;
    storage: MultilingualText;
  };
  disposal: {
    method: MultilingualText;
  };
}

// 初期フォールバックURL（これらが読み込めない場合でもカスタム登録で対応可能にする）
export const GHS_MAP: Record<string, { label: string; url: string }> = {
  'GHS-01': { label: 'Explosive', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/GHS-pictogram-explos.svg/300px-GHS-pictogram-explos.svg.png' },
  'GHS-02': { label: 'Flammable', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/GHS-pictogram-flamm.svg/300px-GHS-pictogram-flamm.svg.png' },
  'GHS-03': { label: 'Oxidizing', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/GHS-pictogram-oxidiz.svg/300px-GHS-pictogram-oxidiz.svg.png' },
  'GHS-04': { label: 'Compressed Gas', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/GHS-pictogram-cylind.svg/300px-GHS-pictogram-cylind.svg.png' },
  'GHS-05': { label: 'Corrosive', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/GHS-pictogram-acid.svg/300px-GHS-pictogram-acid.svg.png' },
  'GHS-06': { label: 'Toxic', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/GHS-pictogram-skull.svg/300px-GHS-pictogram-skull.svg.png' },
  'GHS-07': { label: 'Harmful / Irritant', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/GHS-pictogram-exclam.svg/300px-GHS-pictogram-exclam.svg.png' },
  'GHS-08': { label: 'Health Hazard', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/GHS-pictogram-silhouette.svg/300px-GHS-pictogram-silhouette.svg.png' },
  'GHS-09': { label: 'Environmental', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/GHS-pictogram-pollut.svg/300px-GHS-pictogram-pollut.svg.png' },
};
