import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  HiDownload, 
  HiClipboardCopy, 
  HiArrowLeft, 
  HiPlus, 
  HiExclamationCircle, 
  HiCheckCircle, 
  HiX, 
  HiSparkles,
  HiRefresh
} from 'react-icons/hi';
import API_URL from './config/api';
import DashboardLayout from './components/DashboardLayout';
import IdeaInput from './components/IdeaInput';
import ContextPanel from './components/ContextPanel';
import SavedBlueprintsList from './components/SavedBlueprintsList';
import GenerationStepper from './components/GenerationStepper';
import AuthModal from './components/AuthModal';

export default function App() {
  // Core Configuration State
  const [appIdea, setAppIdea] = useState('');
  const [platform, setPlatform] = useState('web'); // 'web' | 'mobile' | 'both'
  const [detailLevel, setDetailLevel] = useState('full'); // 'brief' | 'full'
  const [blueprint, setBlueprint] = useState('');
  const [activeBlueprintId, setActiveBlueprintId] = useState(null);
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'blueprint'
  const [generatingBlueprint, setGeneratingBlueprint] = useState(null);

  // Authentication State
  const [user, setUser] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAuthMode, setIsAuthMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [loginForm, setLoginForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(null);
  const [resetToken, setResetToken] = useState(null);

  // Blueprints & Favorites Management
  const [savedBlueprints, setSavedBlueprints] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem('appstruct_favorites');
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });

  // UI & Network State
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [lastSubmittedPrompt, setLastSubmittedPrompt] = useState('');
  const [toast, setToast] = useState(null);
  const [chipFocusSignal, setChipFocusSignal] = useState(0);

  // Merged blueprints list with active generating blueprint at the top
  const displayedBlueprints = useMemo(() => {
    if (!generatingBlueprint) return savedBlueprints;
    return [generatingBlueprint, ...savedBlueprints.filter((b) => b._id !== generatingBlueprint._id)];
  }, [generatingBlueprint, savedBlueprints]);

  // Current active blueprint title
  const activeTitle = useMemo(() => {
    if (generatingBlueprint && activeBlueprintId === generatingBlueprint._id) {
      return generatingBlueprint.title;
    }
    const found = savedBlueprints.find((b) => b._id === activeBlueprintId);
    return found ? found.title || found.ideaInput : (appIdea ? appIdea.slice(0, 60) : 'Technical Blueprint');
  }, [generatingBlueprint, activeBlueprintId, savedBlueprints, appIdea]);

  // Toast Helper
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const getAccessToken = () => localStorage.getItem('authToken');

  const persistSession = (token, nextUser) => {
    if (token) localStorage.setItem('authToken', token);
    setUser(nextUser);
  };

  // Restore session + check URL auth tokens on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('verifyToken');
    const incomingResetToken = params.get('resetToken');

    const clearAuthParams = () => {
      window.history.replaceState({}, document.title, window.location.pathname);
    };

    const initAuth = async () => {
      if (verifyToken) {
        try {
          const response = await fetch(`${API_URL}/api/auth/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: verifyToken })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || 'Email verification failed');
          setAuthSuccess(data.message || 'Email verified. You can now sign in.');
          setIsAuthMode('login');
          setIsLoginModalOpen(true);
        } catch (verifyError) {
          setError(verifyError.message);
          setIsLoginModalOpen(true);
        } finally {
          clearAuthParams();
        }
      }

      if (incomingResetToken) {
        setResetToken(incomingResetToken);
        setIsAuthMode('reset');
        setIsLoginModalOpen(true);
        clearAuthParams();
      }

      const token = localStorage.getItem('authToken');
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('authToken');
            setUser(null);
          } else if (response.status === 503) {
            console.warn('Backend database temporarily unavailable during session restore. Preserving token.');
          }
          return;
        }

        const data = await response.json();
        setUser(data.user);
      } catch (sessionError) {
        console.error('Session restore failed:', sessionError);
        // Do not immediately wipe token on network error
      }
    };

    initAuth();
  }, []);

  // Sync favorites with localStorage
  const handleToggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem('appstruct_favorites', JSON.stringify([...next]));
      } catch (e) {
        console.error('Failed to save favorites', e);
      }
      return next;
    });
  };

  // Fetch saved blueprints
  const fetchBlueprints = useCallback(async () => {
    const accessToken = getAccessToken();
    if (!accessToken) return;

    try {
      const response = await fetch(`${API_URL}/api/blueprints`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch blueprints');
      const data = await response.json();
      setSavedBlueprints(data);
    } catch (err) {
      console.error('Error fetching blueprints:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchBlueprints();
    } else {
      setSavedBlueprints([]);
    }
  }, [user, fetchBlueprints]);

  // Auth Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');

      persistSession(data.token, data.user);
      setIsLoginModalOpen(false);
      setError(null);
      setLoginForm({ email: '', password: '', confirmPassword: '' });
      showToast('Welcome back!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const passwordStrong = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/;
      if (!passwordStrong.test(loginForm.password)) {
        setError('Password must be at least 8 characters and include both letters and numbers.');
        return;
      }
      if (loginForm.password !== loginForm.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginForm.email.split('@')[0],
          email: loginForm.email,
          password: loginForm.password
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');

      setError(null);
      setAuthSuccess(data.message || 'Account created! Please check your email to verify before signing in.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForgotPassword = async (email) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Password reset request failed');
      setAuthSuccess(data.message || 'If an account exists, a reset link has been sent to your email.');
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetToken) {
      setError('Password reset token is missing. Please use the link sent to your email.');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: loginForm.password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Password reset failed');
      setAuthSuccess('Password reset successfully. You can now sign in with your new password.');
      setIsAuthMode('login');
      setResetToken(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      const token = getAccessToken();
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        });
      }
    } catch (logoutError) {
      console.error('Logout error:', logoutError);
    }

    localStorage.removeItem('authToken');
    setUser(null);
    setSavedBlueprints([]);
    setLoginForm({ email: '', password: '', confirmPassword: '' });
    showToast('Signed out successfully');
  };

  // Reset / New Blueprint
  const handleNewBlueprint = () => {
    setCurrentView('home');
    if (!isGenerating) {
      setBlueprint('');
      setActiveBlueprintId(null);
      setAppIdea('');
    }
    setError(null);
    setChipFocusSignal((s) => s + 1);
  };

  // Open Blueprint from List
  const handleSelectBlueprint = (bp) => {
    setActiveBlueprintId(bp._id);
    if (bp.isGenerating || bp._id === generatingBlueprint?._id) {
      setBlueprint(generatingBlueprint ? generatingBlueprint.generatedMarkdown : (bp.generatedMarkdown || ''));
      setCurrentView('blueprint');
      setError(null);
      return;
    }
    setAppIdea(bp.ideaInput || bp.title || '');
    setPlatform(bp.platform || 'web');
    if (bp.detailLevel) {
      setDetailLevel(bp.detailLevel);
    }
    setBlueprint(bp.generatedMarkdown || '');
    setCurrentView('blueprint');
    setError(null);
  };

  // Blueprint CRUD Actions
  const handleRenameBlueprint = async (id, newTitle) => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setSavedBlueprints((prev) =>
        prev.map((bp) => (bp._id === id ? { ...bp, title: newTitle, ideaInput: newTitle } : bp))
      );
      showToast('Blueprint renamed');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/blueprints/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        credentials: 'include',
        body: JSON.stringify({ title: newTitle })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to rename blueprint');
      }
      const updated = await response.json();
      setSavedBlueprints((prev) =>
        prev.map((bp) => (bp._id === id ? updated : bp))
      );
      showToast('Blueprint renamed');
    } catch (err) {
      console.error('Rename failed:', err);
      showToast(err.message || 'Failed to rename blueprint', 'error');
    }
  };

  const handleDuplicateBlueprint = async (bp) => {
    const accessToken = getAccessToken();
    const duplicateTitle = `${bp.title || bp.ideaInput} (Copy)`;

    if (!accessToken) {
      const duplicated = {
        ...bp,
        _id: `dup-${Date.now()}`,
        title: duplicateTitle,
        createdAt: new Date().toISOString()
      };
      setSavedBlueprints((prev) => [duplicated, ...prev]);
      showToast('Blueprint duplicated');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/blueprints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        credentials: 'include',
        body: JSON.stringify({
          ideaInput: bp.ideaInput,
          title: duplicateTitle,
          platform: bp.platform || 'web',
          generatedMarkdown: bp.generatedMarkdown,
          detailLevel: bp.detailLevel || 'full'
        })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to duplicate blueprint');
      }
      const savedDoc = await response.json();
      setSavedBlueprints((prev) => [savedDoc, ...prev]);
      showToast('Blueprint duplicated');
    } catch (err) {
      console.error('Duplicate failed:', err);
      showToast(err.message || 'Failed to duplicate blueprint', 'error');
    }
  };

  const handleDeleteBlueprint = async (id) => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setSavedBlueprints((prev) => prev.filter((bp) => bp._id !== id));
      if (activeBlueprintId === id) {
        setBlueprint('');
        setActiveBlueprintId(null);
      }
      showToast('Blueprint deleted');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/blueprints/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        credentials: 'include'
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete blueprint');
      }
      setSavedBlueprints((prev) => prev.filter((bp) => bp._id !== id));
      if (activeBlueprintId === id) {
        setBlueprint('');
        setActiveBlueprintId(null);
      }
      showToast('Blueprint deleted');
    } catch (err) {
      console.error('Delete failed:', err);
      showToast(err.message || 'Failed to delete blueprint', 'error');
    }
  };

  const handleExportBlueprint = (bp) => {
    const mdContent = bp.generatedMarkdown || '';
    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blueprint-${bp._id || 'export'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Blueprint exported as Markdown');
  };

  // Generate Blueprint Flow
  const generateBlueprint = async () => {
    if (!appIdea.trim()) {
      setError('Please provide an application description.');
      return;
    }

    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      setError('Your session has expired. Please sign in again.');
      setIsLoginModalOpen(true);
      return;
    }

    const tempId = `gen-${Date.now()}`;
    const initialTitle = appIdea.trim().slice(0, 80) || 'New Architecture Blueprint';
    const initialGeneratingBp = {
      _id: tempId,
      title: initialTitle,
      ideaInput: appIdea,
      platform,
      detailLevel,
      generatedMarkdown: '',
      createdAt: new Date().toISOString(),
      isGenerating: true
    };

    try {
      setIsGenerating(true);
      setError(null);
      setLastSubmittedPrompt(appIdea);
      setBlueprint(''); // Clear previous output to prepare for new generation
      setGeneratingBlueprint(initialGeneratingBp);
      setActiveBlueprintId(tempId);
      setCurrentView('blueprint');

      const response = await fetch(`${API_URL}/api/generate-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        credentials: 'include',
        body: JSON.stringify({
          idea: appIdea,
          platform: platform,
          detailLevel: detailLevel
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to generate blueprint. Please try again.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullMarkdown = '';
      let streamFinishedCleanly = false;
      let buffer = '';

      const updateMarkdown = (md) => {
        setGeneratingBlueprint((prev) => (prev ? { ...prev, generatedMarkdown: md } : null));
        setBlueprint(md);
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Retain incomplete chunk in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.type === 'chunk') {
                fullMarkdown += parsed.text;
                updateMarkdown(fullMarkdown);
              } else if (parsed.type === 'done') {
                streamFinishedCleanly = true;
                if (parsed.fullMarkdown) {
                  fullMarkdown = parsed.fullMarkdown;
                }
                updateMarkdown(fullMarkdown);
              } else if (parsed.type === 'error') {
                throw new Error(parsed.message || 'Stream generation failed midway.');
              }
            } catch (parseErr) {
              if (parseErr.message && !parseErr.message.includes('JSON')) {
                throw parseErr;
              }
              // If raw legacy chunk
              fullMarkdown += jsonStr;
              updateMarkdown(fullMarkdown);
            }
          }
        }
      }

      // Check remaining buffer
      if (buffer.trim().startsWith('data: ')) {
        const jsonStr = buffer.trim().slice(6);
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.type === 'done') {
            streamFinishedCleanly = true;
            if (parsed.fullMarkdown) {
              fullMarkdown = parsed.fullMarkdown;
            }
            updateMarkdown(fullMarkdown);
          } else if (parsed.type === 'error') {
            throw new Error(parsed.message || 'Stream generation failed midway.');
          }
        } catch (e) {
          if (e.message && !e.message.includes('JSON')) throw e;
        }
      }

      if (!streamFinishedCleanly) {
        throw new Error('Generation terminated unexpectedly before completion. Partial blueprint retained in editor. Click retry to generate again.');
      }

      // Auto-save blueprint to database ONLY if generation completed successfully
      try {
        const saveRes = await fetch(`${API_URL}/api/blueprints`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          credentials: 'include',
          body: JSON.stringify({
            ideaInput: appIdea,
            title: initialTitle,
            platform: platform,
            generatedMarkdown: fullMarkdown,
            detailLevel: detailLevel
          })
        });

        if (saveRes.ok) {
          const savedData = await saveRes.json();
          setSavedBlueprints((prev) => [savedData, ...prev.filter((b) => b._id !== tempId)]);
          setActiveBlueprintId(savedData._id);
          setGeneratingBlueprint(null);
        }
      } catch (saveErr) {
        console.error('Failed to auto-save blueprint:', saveErr);
      }

    } catch (genError) {
      console.error('Generation failed:', genError);
      setError(genError.message || 'Something went wrong while generating the blueprint.');
      setGeneratingBlueprint(null);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-zinc-100 flex flex-col font-sans">
      
      {/* Toast Banner */}
      {toast && (
        <div 
          role="status"
          aria-live="polite"
          className="fixed top-14 right-4 z-50 bg-zinc-900 text-white text-xs font-medium px-3.5 py-2 rounded-md shadow-lg flex items-center gap-2 animate-fade-in"
        >
          {toast.type === 'error' ? (
            <HiExclamationCircle className="w-4 h-4 text-red-400" />
          ) : (
            <HiCheckCircle className="w-4 h-4 text-zinc-300" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <DashboardLayout
        headerContent={
          <div className="flex items-center gap-2 text-xs">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-100 text-zinc-700 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="max-w-[120px] truncate">{user.email || user.username}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-zinc-500 hover:text-zinc-900 px-2 py-1 rounded hover:bg-zinc-100 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthMode('login');
                    setIsLoginModalOpen(true);
                    setError(null);
                  }}
                  className="px-2.5 py-1 font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthMode('register');
                    setIsLoginModalOpen(true);
                    setError(null);
                  }}
                  className="px-3 py-1 font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors shadow-2xs"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        }
        sidebar={
          <div className="flex flex-col h-full">
            {/* New Blueprint Primary Action */}
            <div className="p-3 border-b border-zinc-200/80">
              <button
                type="button"
                onClick={handleNewBlueprint}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-xs font-semibold shadow-2xs transition-all active:scale-[0.99]"
              >
                <HiPlus className="w-4 h-4" />
                <span>New Blueprint</span>
              </button>
            </div>

            {/* Scalable Saved Blueprints List */}
            <div className="flex-1 overflow-hidden">
              <SavedBlueprintsList
                blueprints={displayedBlueprints}
                activeId={activeBlueprintId}
                onSelect={handleSelectBlueprint}
                onRename={handleRenameBlueprint}
                onDuplicate={handleDuplicateBlueprint}
                onExport={handleExportBlueprint}
                onDelete={handleDeleteBlueprint}
                onToggleFavorite={handleToggleFavorite}
                favorites={favorites}
              />
            </div>
          </div>
        }
        toolbar={
          currentView === 'blueprint' ? (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setCurrentView('home')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-md transition-colors flex-shrink-0"
                >
                  <HiArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Editor</span>
                </button>
                <div className="h-4 w-px bg-zinc-200 flex-shrink-0" />
                <span className="text-xs font-semibold text-zinc-900 truncate">
                  {activeTitle}
                </span>
                {isGenerating && activeBlueprintId === generatingBlueprint?._id && (
                  <span 
                    className="inline-flex items-center gap-0.5 text-zinc-500 ml-1 flex-shrink-0"
                    aria-label="Generating blueprint"
                  >
                    <span className="w-1 h-1 rounded-full bg-zinc-600 animate-dot-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 rounded-full bg-zinc-600 animate-dot-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 rounded-full bg-zinc-600 animate-dot-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  disabled={!blueprint}
                  onClick={() => {
                    if (!blueprint) return;
                    navigator.clipboard.writeText(blueprint);
                    showToast('Blueprint markdown copied to clipboard');
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    blueprint
                      ? 'text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200'
                      : 'text-zinc-300 bg-zinc-50 cursor-not-allowed'
                  }`}
                >
                  <HiClipboardCopy className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Copy</span>
                </button>

                <button
                  type="button"
                  disabled={!blueprint}
                  onClick={() => {
                    if (!blueprint) return;
                    const blob = new Blob([blueprint], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `app-blueprint-${Date.now()}.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast('Blueprint downloaded');
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md shadow-2xs transition-colors ${
                    blueprint
                      ? 'text-white bg-zinc-900 hover:bg-zinc-800'
                      : 'text-zinc-400 bg-zinc-200 cursor-not-allowed'
                  }`}
                >
                  <HiDownload className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </button>
              </div>
            </>
          ) : null
        }
        rightSidebar={
          <ContextPanel
            platform={platform}
            detailLevel={detailLevel}
            isGenerating={isGenerating}
          />
        }
      >
        {/* ================= WORKSPACE VIEW SWITCHER ================= */}
        {currentView === 'home' ? (
          <div className="w-full flex flex-col items-center">
            
            {/* COMPACT HERO SECTION (Occupies upper 20-25% of workspace) */}
            <header className="w-full pt-2 pb-6 text-center">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-zinc-200 bg-zinc-100 text-[11px] font-medium text-zinc-700 mb-2">
                <HiSparkles className="w-3 h-3 text-zinc-500" />
                <span>AI-powered architecture</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
                Architect your next idea with AI.
              </h1>

              <p className="mt-1.5 text-xs sm:text-sm text-zinc-500 max-w-lg mx-auto leading-relaxed">
                Describe your application and receive a production-ready technical blueprint in seconds.
              </p>
            </header>

            {/* ERROR STATE: Preserves user input and provides Retry */}
            {error && !isLoginModalOpen && (
              <div 
                role="alert"
                className="w-full mb-6 p-3.5 rounded-xl bg-red-50/90 border border-red-200 text-xs text-red-900 flex items-start justify-between gap-3 animate-fade-in"
              >
                <div className="flex items-start gap-2.5">
                  <HiExclamationCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-red-950">Something went wrong</span>
                    <p className="text-red-700 mt-0.5 leading-relaxed">
                      {error} Your application description is still here. Try again.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (lastSubmittedPrompt && !appIdea) setAppIdea(lastSubmittedPrompt);
                      generateBlueprint();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors"
                  >
                    <HiRefresh className="w-3 h-3" /> Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-700 p-1"
                    aria-label="Dismiss error"
                  >
                    <HiX className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* INPUT FORM */}
            <IdeaInput
              value={appIdea}
              onChange={(v) => {
                setAppIdea(v);
                if (error) setError(null);
              }}
              platform={platform}
              onPlatformChange={setPlatform}
              detailLevel={detailLevel}
              onDetailChange={setDetailLevel}
              onGenerate={generateBlueprint}
              isGenerating={isGenerating}
              focusSignal={chipFocusSignal}
            />

            {/* GENERATION PROGRESS STEPPER */}
            <GenerationStepper isGenerating={isGenerating} />
          </div>
        ) : (
          
          /* ================= TECHNICAL BLUEPRINT VIEWER ================= */
          <div className="w-full flex flex-col animate-fade-in">
            {/* Markdown Content Area - Scrolls smoothly under the locked toolbar */}
            <article className="prose w-full bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-xs">
              {blueprint ? (
                <ReactMarkdown>{blueprint}</ReactMarkdown>
              ) : (
                <div className="py-12 text-center text-zinc-400">
                  <p className="text-sm font-medium text-zinc-600">Initializing blueprint architecture...</p>
                </div>
              )}
            </article>

            {/* Persistent Generation Status at the bottom */}
            {isGenerating && activeBlueprintId === generatingBlueprint?._id && (
              <div 
                role="status" 
                aria-live="polite"
                className="mt-4 w-full py-3 px-4 bg-zinc-50 border border-zinc-200/90 rounded-xl flex items-center justify-between text-xs text-zinc-600 shadow-2xs animate-fade-in"
              >
                <div className="flex items-center gap-2">
                  <HiSparkles className="w-4 h-4 text-zinc-700 animate-pulse" />
                  <span className="font-medium text-zinc-800">Generating blueprint</span>
                  <span 
                    className="inline-flex items-center gap-0.5 ml-0.5 text-zinc-800"
                    aria-label="Generation in progress"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 animate-dot-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 animate-dot-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 animate-dot-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 font-mono">Real-time AI Stream</span>
              </div>
            )}
          </div>
        )}
      </DashboardLayout>

      {/* ================= LOGIN / REGISTER MODAL ================= */}
      <AuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        isAuthMode={isAuthMode}
        setIsAuthMode={setIsAuthMode}
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        error={error}
        setError={setError}
        authSuccess={authSuccess}
        setAuthSuccess={setAuthSuccess}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        showConfirmPassword={showConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        handleLogin={handleLogin}
        handleRegister={handleRegister}
        handleResetPassword={handleResetPassword}
        handleForgotPassword={handleForgotPassword}
        API_URL={API_URL}
        persistSession={persistSession}
        showToast={showToast}
      />

    </div>
  );
}
