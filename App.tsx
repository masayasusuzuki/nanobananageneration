import React, { useState, useEffect } from 'react';
import { setApiKey, getApiKey } from './services/geminiService';
import { Button } from './components/Button';
import PortraitGenerator from './components/PortraitGenerator';
import LPGenerator from './components/LPGenerator';
import ImageEditor from './components/ImageEditor';
import StyleChanger from './components/StyleChanger';
import ImageGenerator from './components/ImageGenerator';
import { Sparkles, Key, ExternalLink, Layout, Image, Sliders, Palette, Wand2 } from 'lucide-react';

type TabType = 'portrait' | 'lp' | 'editor' | 'style' | 'generate';

const App: React.FC = () => {
  // Authentication State
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isKeyLoading, setIsKeyLoading] = useState(true);
  const [apiKeyInput, setApiKeyInput] = useState('');

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('portrait');

  // Check for API Key on mount
  useEffect(() => {
    const existingKey = getApiKey();
    if (existingKey) {
      setHasApiKey(true);
    }
    setIsKeyLoading(false);
  }, []);

  const handleSubmitApiKey = () => {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim());
      setHasApiKey(true);
    }
  };

  const handleApiError = () => {
    setHasApiKey(false);
  };

  const handleLogout = () => {
    setApiKey('');
    setApiKeyInput('');
    setHasApiKey(false);
  };

  if (isKeyLoading) {
    return <div className="min-h-screen bg-surface-950 flex items-center justify-center text-slate-500">Loading...</div>;
  }

  // API Key Input Screen
  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface-900 border border-surface-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/40">
            <Sparkles className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Gemini Creative Studio</h1>
          <p className="text-slate-400 mb-6">
            Gemini APIキーを入力してください。
          </p>

          <div className="space-y-4 mb-6">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Gemini APIキーを入力"
              className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmitApiKey();
                }
              }}
            />
            <Button onClick={handleSubmitApiKey} className="w-full" disabled={!apiKeyInput.trim()}>
              <Key className="w-5 h-5" />
              開始する
            </Button>
          </div>

          <div className="text-xs text-slate-500 border-t border-surface-800 pt-4">
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-blue-400 transition-colors"
            >
              APIキーの取得はこちら <ExternalLink size={12} />
            </a>
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
            <button
              onClick={handleLogout}
              className="text-xs text-slate-500 hover:text-white transition-colors"
              title="APIキーを変更"
            >
              キー変更
            </button>
          </div>
        </div>
      </header>

      {/* Tab Content */}
      {activeTab === 'portrait' && (
        <PortraitGenerator onApiError={handleApiError} />
      )}
      {activeTab === 'lp' && (
        <LPGenerator />
      )}
      {activeTab === 'editor' && (
        <ImageEditor onApiError={handleApiError} />
      )}
      {activeTab === 'style' && (
        <StyleChanger onApiError={handleApiError} />
      )}
      {activeTab === 'generate' && (
        <ImageGenerator onApiError={handleApiError} />
      )}
    </div>
  );
};

export default App;
