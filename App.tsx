import React, { useState, useEffect } from 'react';
import { setApiKey, getApiKey } from './services/geminiService';
import PortraitGenerator from './components/PortraitGenerator';
import LPGenerator from './components/LPGenerator';
import ImageEditor from './components/ImageEditor';
import StyleChanger from './components/StyleChanger';
import ImageGenerator from './components/ImageGenerator';
import { Sparkles, Layout, Image, Sliders, Palette, Wand2, Key } from 'lucide-react';

type TabType = 'portrait' | 'lp' | 'editor' | 'style' | 'generate';

const App: React.FC = () => {
  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('portrait');
  // API Key State
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing API key on mount
  useEffect(() => {
    const existingKey = getApiKey();
    if (existingKey) {
      setIsApiKeySet(true);
    }
    setIsLoading(false);
  }, []);

  // Handle API key submission
  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim());
      setIsApiKeySet(true);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-950 text-slate-200 flex items-center justify-center">
        <div className="animate-pulse text-lg">読み込み中...</div>
      </div>
    );
  }

  // API Key Input Screen
  if (!isApiKeySet) {
    return (
      <div className="min-h-screen bg-surface-950 text-slate-200 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-8 shadow-xl">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center mb-4">
                <Sparkles className="text-white w-8 h-8" />
              </div>
              <h1 className="font-bold text-2xl tracking-tight text-white text-center">
                Gemini <span className="text-blue-400 font-light">Creative Studio</span>
              </h1>
              <p className="text-slate-400 text-sm mt-2 text-center">
                画像生成・編集ツール
              </p>
            </div>

            {/* API Key Form */}
            <form onSubmit={handleApiKeySubmit} className="space-y-4">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-slate-300 mb-2">
                  <Key className="inline w-4 h-4 mr-1" />
                  Gemini APIキー
                </label>
                <input
                  type="password"
                  id="apiKey"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-3 bg-surface-800 border border-surface-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!apiKeyInput.trim()}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-surface-700 disabled:to-surface-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-900/30 disabled:shadow-none"
              >
                開始する
              </button>
            </form>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-surface-800/50 rounded-lg border border-surface-700">
              <p className="text-xs text-slate-400">
                <strong className="text-slate-300">APIキーの取得方法:</strong><br />
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Google AI Studio
                </a>
                {' '}からAPIキーを取得してください。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
