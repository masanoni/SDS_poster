
import React, { useState, useRef, useEffect } from 'react';
import { analyzeMSDS } from './geminiService';
import { MSDSData, Language, GHS_MAP, MultilingualText } from './types';
import { 
  FileText, 
  Upload, 
  Printer, 
  ShieldAlert, 
  Zap, 
  Droplet, 
  Flame, 
  Package, 
  Trash2, 
  Info,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Settings,
  X,
  CheckCircle2,
  Image as ImageIcon,
  Key,
  ExternalLink,
  Lock,
  LogOut
} from 'lucide-react';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeyValid, setIsKeyValid] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msdsData, setMsdsData] = useState<MSDSData | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [customPictograms, setCustomPictograms] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pictogramInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  // 初期化: localStorageからキーとピクトグラムを読み込む
  useEffect(() => {
    const savedKey = localStorage.getItem('factory_gemini_key') || process.env.API_KEY || '';
    if (savedKey) {
      setApiKey(savedKey);
      setIsKeyValid(true);
    }

    const savedLibrary = localStorage.getItem('factory_ghs_library');
    if (savedLibrary) {
      try {
        setCustomPictograms(JSON.parse(savedLibrary));
      } catch (e) {
        console.error("Failed to load pictogram library");
      }
    }
  }, []);

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim().length > 10) {
      localStorage.setItem('factory_gemini_key', apiKey.trim());
      setIsKeyValid(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('factory_gemini_key');
    setApiKey('');
    setIsKeyValid(false);
    setMsdsData(null);
  };

  const savePictogram = (code: string, base64: string) => {
    const next = { ...customPictograms, [code]: base64 };
    setCustomPictograms(next);
    localStorage.setItem('factory_ghs_library', JSON.stringify(next));
  };

  const handlePictogramUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeSlot) return;
    const reader = new FileReader();
    reader.onload = () => {
      savePictogram(activeSlot, reader.result as string);
      setActiveSlot(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const data = await analyzeMSDS(base64, file.type, apiKey);
        setMsdsData(data);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || "解析中にエラーが発生しました。");
      setLoading(false);
    }
  };

  const normalizeGHS = (raw: string): string => {
    const input = raw.toLowerCase();
    const digits = input.match(/\d+/);
    if (digits) {
      const num = parseInt(digits[0]);
      if (num >= 1 && num <= 9) return `GHS-${num.toString().padStart(2, '0')}`;
    }
    if (input.includes('爆発') || input.includes('explos')) return 'GHS-01';
    if (input.includes('引火') || input.includes('flam')) return 'GHS-02';
    if (input.includes('酸化') || input.includes('oxidiz')) return 'GHS-03';
    if (input.includes('ガス') || input.includes('gas')) return 'GHS-04';
    if (input.includes('腐食') || input.includes('corros')) return 'GHS-05';
    if (input.includes('毒') || input.includes('toxic')) return 'GHS-06';
    if (input.includes('有害') || input.includes('刺激') || input.includes('harm')) return 'GHS-07';
    if (input.includes('健康') || input.includes('health')) return 'GHS-08';
    if (input.includes('環境') || input.includes('environ')) return 'GHS-09';
    return '';
  };

  const getPictogramUrl = (code: string): string => {
    return customPictograms[code] || GHS_MAP[code]?.url || '';
  };

  const getSafeText = (text?: Partial<MultilingualText>): MultilingualText => ({
    ja: text?.ja || '記載なし',
    en: text?.en || 'N/A',
    vi: text?.vi || 'N/A'
  });

  const LangLabel: React.FC<{ text: MultilingualText; isMain?: boolean }> = ({ text, isMain }) => (
    <div className="space-y-1">
      <div className="flex items-start">
        <span className="bg-red-600 text-white text-[7px] px-1 rounded mr-2 mt-1 font-bold">JP</span>
        <p className={`${isMain ? 'text-lg' : 'text-sm'} font-bold text-gray-900 leading-tight`}>{text.ja}</p>
      </div>
      <div className="flex items-start">
        <span className="bg-blue-600 text-white text-[7px] px-1 rounded mr-2 mt-1 font-bold">EN</span>
        <p className="text-[10px] text-gray-600 italic leading-tight">{text.en}</p>
      </div>
      <div className="flex items-start">
        <span className="bg-yellow-600 text-white text-[7px] px-1 rounded mr-2 mt-1 font-bold">VN</span>
        <p className="text-[10px] text-gray-800 font-medium leading-tight">{text.vi}</p>
      </div>
    </div>
  );

  const SectionHeader: React.FC<{ icon: React.ReactNode; titleJa: string; titleEn: string }> = ({ icon, titleJa, titleEn }) => (
    <div className="bg-gray-900 text-white px-3 py-1.5 mb-3 flex items-center border-l-4 border-red-600">
      <div className="mr-3 scale-75">{icon}</div>
      <div>
        <h3 className="text-xs font-black leading-none">{titleJa}</h3>
        <p className="text-[7px] opacity-60 leading-none mt-1 uppercase">{titleEn}</p>
      </div>
    </div>
  );

  const PageContainer: React.FC<{ children: React.ReactNode; pageNum: number }> = ({ children, pageNum }) => (
    <div className="bg-white w-[210mm] min-h-[297mm] mx-auto flex flex-col mb-10 print:mb-0 border border-gray-200 print:border-none shadow-xl print:shadow-none overflow-hidden relative">
      <div className="bg-red-800 p-5 text-white flex justify-between items-end border-b-4 border-black">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">Chemical Safety Poster</h1>
          <p className="text-[9px] font-bold mt-1 opacity-80 uppercase tracking-widest">Emergency Summary • Page {pageNum} / 2</p>
        </div>
        <div className="text-right text-[9px] font-bold leading-tight uppercase">
          安全要約掲示<br/>Tóm tắt an toàn
        </div>
      </div>
      <div className="flex-grow p-10 space-y-8">
        {children}
      </div>
      <div className="bg-gray-100 p-2 text-[7px] text-gray-400 text-center uppercase tracking-widest border-t border-gray-200">
        Factory Visual Aid System • For Internal Use Only
      </div>
    </div>
  );

  // Gateway Screen
  if (!isKeyValid) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="bg-red-600 p-8 text-white text-center">
            <ShieldAlert className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-black uppercase tracking-tight">Factory Safety Setup</h1>
            <p className="text-red-100 text-sm mt-2">Gemini APIキーを設定して開始してください</p>
          </div>
          
          <form onSubmit={handleKeySubmit} className="p-10 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="bg-indigo-100 p-2 rounded-xl"><Key className="w-6 h-6 text-indigo-600" /></div>
                <div className="flex-grow">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Gemini API Key</label>
                  <input 
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-transparent border-none p-0 focus:ring-0 font-mono text-sm"
                    required
                  />
                </div>
              </div>
              
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 text-indigo-600 font-bold text-sm hover:underline py-2"
              >
                <span>APIキーを取得する</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="space-y-4 border-t border-gray-100 pt-6">
              <div className="flex items-start space-x-3 text-xs text-gray-500">
                <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                <p>入力されたキーはブラウザのローカルストレージにのみ保存され、サーバーには送信されません。</p>
              </div>
              <button 
                type="submit" 
                className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all active:scale-95"
              >
                セットアップ完了
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 no-print:py-12">
      {/* App Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-3 flex justify-between items-center no-print shadow-sm">
        <div className="flex items-center space-x-3">
          <ShieldAlert className="text-red-600 w-7 h-7" />
          <h1 className="font-black text-lg tracking-tighter uppercase text-gray-900">Safety Assistant</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setShowSettings(true)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all">
            <Settings className="w-6 h-6" />
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-xs flex items-center space-x-2 shadow-md hover:bg-indigo-700 transition-all">
            <Upload className="w-4 h-4" />
            <span>SDS読込</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
        </div>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gray-900 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">Configuration</h2>
                <p className="text-[10px] text-gray-400 uppercase font-bold mt-1">環境設定とピクトグラム管理</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-10 space-y-12">
              <section>
                <h3 className="text-xs font-black uppercase text-gray-400 mb-6 tracking-widest border-b pb-2">API Management</h3>
                <div className="flex items-center justify-between p-6 bg-red-50 rounded-2xl border border-red-100">
                  <div className="flex items-center space-x-4">
                    <Key className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="font-bold text-gray-900">APIキーをリセット</p>
                      <p className="text-xs text-gray-500 italic">別のプロジェクトのキーを使用する場合やログアウトする場合</p>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="bg-white text-red-600 border border-red-200 px-6 py-3 rounded-xl font-black text-xs flex items-center space-x-2 hover:bg-red-600 hover:text-white transition-all">
                    <LogOut className="w-4 h-4" />
                    <span>ログアウト</span>
                  </button>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black uppercase text-gray-400 mb-6 tracking-widest border-b pb-2">GHS Pictogram Library</h3>
                <div className="grid grid-cols-3 gap-6">
                  {Object.keys(GHS_MAP).map((code) => (
                    <div key={code} className="bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 flex flex-col items-center group relative hover:border-indigo-200 transition-all">
                      <div className="absolute top-3 right-3">
                        {customPictograms[code] ? <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-50" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-200" />}
                      </div>
                      <div className="w-20 h-20 bg-white rounded-xl shadow-inner mb-3 flex items-center justify-center overflow-hidden border border-gray-100">
                        {getPictogramUrl(code) ? <img src={getPictogramUrl(code)} className="w-full h-full object-contain p-2" /> : <ImageIcon className="w-8 h-8 text-gray-200" />}
                      </div>
                      <h4 className="text-[10px] font-black uppercase text-gray-400 mb-1">{code}</h4>
                      <p className="text-xs font-bold text-gray-800 text-center mb-4 min-h-[2em]">{GHS_MAP[code].label}</p>
                      <button onClick={() => { setActiveSlot(code); pictogramInputRef.current?.click(); }} className="w-full py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">Upload PNG</button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
          <input type="file" ref={pictogramInputRef} onChange={handlePictogramUpload} className="hidden" accept="image/*" />
        </div>
      )}

      <main className="mt-20 flex flex-col items-center px-4">
        {!msdsData && !loading && (
          <div className="w-full max-w-xl bg-white p-16 rounded-[3rem] border-8 border-gray-50 text-center shadow-2xl mt-12">
            <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
              <FileText className="text-indigo-600 w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black mb-4 text-gray-900 tracking-tighter">SDS ANALYSIS</h2>
            <p className="text-gray-500 mb-10 text-lg font-medium leading-relaxed">
              お手元のSDSファイルをアップロードしてください。<br/>GHSピクトグラムを含めた要約ポスターを生成します。
            </p>
            <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-600 text-white px-12 py-5 rounded-3xl font-black text-2xl shadow-2xl hover:scale-105 transition-all active:scale-95">
              スキャン開始
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-24 bg-white w-full max-w-xl rounded-[3rem] shadow-2xl mt-12 border-8 border-gray-50">
            <Loader2 className="w-20 h-20 text-indigo-600 animate-spin mx-auto mb-8" />
            <h3 className="text-2xl font-black text-gray-900">文書を解析中</h3>
            <p className="text-gray-400 mt-3 font-bold uppercase tracking-widest text-[10px]">Processing GHS Codes & Multilingual Data</p>
          </div>
        )}

        {msdsData && (
          <div className="w-full flex flex-col items-center space-y-12 print:space-y-0">
            {/* Page 1 */}
            <PageContainer pageNum={1}>
              <section>
                <SectionHeader icon={<Info className="w-5 h-5"/>} titleJa="基本情報" titleEn="Product Information" />
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-100">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Product Name / 製品名</p>
                    <LangLabel text={getSafeText(msdsData.basicInfo?.productName)} isMain />
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-100">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Company / 会社名</p>
                    <LangLabel text={getSafeText(msdsData.basicInfo?.companyName)} />
                  </div>
                </div>
              </section>

              <section>
                <SectionHeader icon={<AlertTriangle className="w-5 h-5"/>} titleJa="危険有害性" titleEn="GHS Hazards" />
                <div className="flex gap-8 items-start">
                  <div className="w-[35%] grid grid-cols-2 gap-3">
                    {msdsData.hazards?.ghsPictograms?.map((p, idx) => {
                      const code = normalizeGHS(p);
                      const img = getPictogramUrl(code);
                      if (!img) return null;
                      return (
                        <div key={idx} className="aspect-square border-[3px] border-red-600 rounded-xl p-2 bg-white shadow-md flex items-center justify-center relative group">
                          <img src={img} className="w-full h-full object-contain" alt={code} />
                          <div className="absolute -bottom-1 left-0 right-0 bg-red-600 text-white text-[6px] font-black text-center py-0.5 uppercase rounded-b-sm">
                            {GHS_MAP[code]?.label || code}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="w-[65%] space-y-4">
                    <div className="bg-orange-50 p-4 rounded-xl border-2 border-orange-100">
                      <p className="text-[8px] font-black text-orange-800 uppercase mb-2">Classification / 分類</p>
                      <LangLabel text={getSafeText(msdsData.hazards?.ghsClass)} />
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl border-2 border-red-100">
                      <p className="text-[8px] font-black text-red-800 uppercase mb-2">Hazards / 危険情報</p>
                      <LangLabel text={getSafeText(msdsData.hazards?.hazardStatements)} />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <SectionHeader icon={<Droplet className="w-5 h-5"/>} titleJa="成分情報" titleEn="Ingredients" />
                <div className="grid grid-cols-2 gap-4">
                  {msdsData.composition?.ingredients?.slice(0, 4).map((ing, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-xl border-2 border-gray-100 flex justify-between items-center">
                      <LangLabel text={getSafeText(ing.name)} />
                      <span className="bg-gray-900 text-white px-2 py-1 rounded font-black text-xs shrink-0 ml-4">{ing.concentration}</span>
                    </div>
                  ))}
                </div>
              </section>
            </PageContainer>

            {/* Page 2 */}
            <PageContainer pageNum={2}>
              <section>
                <SectionHeader icon={<Zap className="w-5 h-5"/>} titleJa="応急措置" titleEn="First Aid Measures" />
                <div className="grid grid-cols-2 gap-6">
                  {['inhaled', 'skin', 'eyes', 'swallowed'].map((key) => (
                    <div key={key} className="bg-blue-50 p-5 rounded-2xl border-2 border-blue-100">
                      <h4 className="text-[10px] font-black text-blue-900 border-b-2 border-blue-200 mb-2 pb-1 uppercase">{key}</h4>
                      <LangLabel text={getSafeText((msdsData.firstAid as any)[key])} />
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <SectionHeader icon={<Package className="w-5 h-5"/>} titleJa="取扱い・保管" titleEn="Handling & Storage" />
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-green-50 p-5 rounded-2xl border-2 border-green-100">
                    <p className="text-[8px] font-black text-green-800 uppercase mb-2">Storage / 保管条件</p>
                    <LangLabel text={getSafeText(msdsData.handlingStorage?.storage)} />
                  </div>
                  <div className="bg-gray-50 p-5 rounded-2xl border-2 border-gray-100">
                    <p className="text-[8px] font-black text-gray-800 uppercase mb-2">Disposal / 廃棄上の注意</p>
                    <LangLabel text={getSafeText(msdsData.disposal?.method)} />
                  </div>
                </div>
              </section>

              <section>
                <SectionHeader icon={<Flame className="w-5 h-5"/>} titleJa="消火措置" titleEn="Firefighting" />
                <div className="bg-red-50 p-5 rounded-2xl border-2 border-red-100">
                  <LangLabel text={getSafeText(msdsData.firefighting?.extinguishingMedia)} />
                </div>
              </section>
            </PageContainer>
          </div>
        )}
      </main>

      {/* Action FAB */}
      {msdsData && (
        <div className="fixed bottom-10 right-10 no-print flex flex-col space-y-4">
          <button onClick={() => { setMsdsData(null); window.scrollTo(0,0); }} className="p-5 bg-gray-900 text-white rounded-full shadow-2xl hover:scale-110 transition-all border-4 border-white">
            <RefreshCw className="w-8 h-8" />
          </button>
          <button onClick={() => window.print()} className="p-5 bg-indigo-600 text-white rounded-full shadow-2xl hover:scale-110 transition-all border-4 border-white">
            <Printer className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
