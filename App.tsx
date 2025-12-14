import React, { useState, useEffect } from 'react';
import { setApiKey } from './services/geminiService';
import PortraitGenerator from './components/PortraitGenerator';
import LPGenerator from './components/LPGenerator';
import ImageEditor from './components/ImageEditor';
import StyleChanger from './components/StyleChanger';
import ImageGenerator from './components/ImageGenerator';
import { Sparkles, Layout, Image, Sliders, Palette, Wand2 } from 'lucide-react';

type TabType = 'portrait' | 'lp' | 'editor' | 'style' | 'generate';

const DEFAULT_API_KEY = 'AIzaSyBDrg_gD07z5YpJbXliKydTTxUrq2ktWsg';

const App: React.FC = () => {
  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('portrait');

  // Set API Key on mount
  useEffect(() => {
    setApiKey(DEFAULT_API_KEY);
  }, []);

  // Main App UI
  return (
    <div className="min-h-screen bg-surface-950 text-slate-200 selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-surface-800 bg-surface-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center">
                <Sparkles className="text-white w-5 h-5" />
              </div>
              <h1 className="font-bold text-xl tracking-tight text-white">Gemini <span className="text-blue-400 font-light">Creative Studio</span></h1>
            </div>

            {/* Tab Navigation */}
            <nav className="flex items-center gap-1 ml-6 bg-surface-900 rounded-lg p-1 border border-surface-800">
              <button
                onClick={() => setActiveTab('portrait')}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                  ${activeTab === 'portrait'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-surface-800'}
                `}
              >
                <Image size={16} />
                ポートレート
              </button>
              <button
                onClick={() => setActiveTab('lp')}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                  ${activeTab === 'lp'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-surface-800'}
                `}
              >
                <Layout size={16} />
                LP制作
              </button>
              <button
                onClick={() => setActiveTab('editor')}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                  ${activeTab === 'editor'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-surface-800'}
                `}
              >
                <Sliders size={16} />
                画像編集
              </button>
              <button
                onClick={() => setActiveTab('style')}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                  ${activeTab === 'style'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-surface-800'}
                `}
              >
                <Palette size={16} />
                スタイル変換
              </button>
              <button
                onClick={() => setActiveTab('generate')}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                  ${activeTab === 'generate'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-surface-800'}
                `}
              >
                <Wand2 size={16} />
                画像生成
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs font-mono text-slate-500 border border-surface-700 px-2 py-1 rounded bg-surface-900 hidden sm:block">
              Model: gemini-3-pro-image-preview
            </div>
          </div>
        </div>
      </header>

      {/* Tab Content */}
      {activeTab === 'portrait' && (
        <PortraitGenerator />
      )}
      {activeTab === 'lp' && (
        <LPGenerator />
      )}
      {activeTab === 'editor' && (
        <ImageEditor />
      )}
      {activeTab === 'style' && (
        <StyleChanger />
      )}
      {activeTab === 'generate' && (
        <ImageGenerator />
      )}
    </div>
  );
};

export default App;
