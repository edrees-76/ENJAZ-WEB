import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Eye, EyeOff } from 'lucide-react';
import apiClient from '../services/apiClient';

export const Login = () => {
  const [username, setUsername] = useState(() => localStorage.getItem('savedUsername') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('savedUsername') !== null);
  const [showPassword, setShowPassword] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [error, setError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  // Theme Sync
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Lockout countdown
  useEffect(() => {
    if (lockoutSeconds === null || lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setError('');
          setLockoutSeconds(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds) return;
    setIsLoading(true);
    setError('');
    setRemainingAttempts(null);
    
    try {
      // ✅ PRIMARY: Try real backend API first
      const response = await apiClient.post('/auth/login', { username, password });
      
      if (rememberMe) {
        localStorage.setItem('savedUsername', username);
      } else {
        localStorage.removeItem('savedUsername');
      }

      login(response.data);
      
      // تعيين علامة الترحيب لتعرضها لوحة القيادة
      sessionStorage.setItem('showWelcome', 'true');

      navigate('/app');
    } catch (err: any) {
      // Check if it's a network error (backend unreachable) → fallback to Demo Mode
      if (!err.response) {
        // 🚀 DEMO MODE FALLBACK: Backend not reachable, use mock data
        if (import.meta.env.DEV) console.debug('⚡ Backend unreachable — switching to Demo Mode');
        
        const mockResponse = {
          accessToken: 'demo_token_123456789',
          user: {
            id: 1,
            username: username,
            fullName: 'مدير النظام (وضع الاستعراض)',
            role: 'Admin' as const,
            roleDisplayName: 'مدير نظام',
            permissions: 63,
            isEditor: true,
            isActive: true
          }
        };
        
        if (rememberMe) {
          localStorage.setItem('savedUsername', username);
        } else {
          localStorage.removeItem('savedUsername');
        }

        login(mockResponse as any);
        sessionStorage.setItem('showWelcome', 'true');
        navigate('/app');
        return;
      }
      
      // Real backend error responses
      const data = err.response?.data;
      if (err.response?.status === 429) {
        setError(data?.message || 'تم تجاوز الحد الأقصى للمحاولات');
        setLockoutSeconds(data?.retryAfterSeconds || 300);
        setRemainingAttempts(null);
      } else {
        setError(data?.message || 'اسم المستخدم أو كلمة المرور غير صحيحة');
        setRemainingAttempts(data?.remainingAttempts ?? null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500" dir="rtl">
      {/* 3D Floating Spheres Background */}
      <div className="float-sphere w-[500px] h-[500px] bg-sky-400 top-[-10%] left-[-5%]"></div>
      <div className="float-sphere w-[400px] h-[400px] bg-blue-500 bottom-[-5%] right-[-5%]" style={{ animationDelay: '-5s' }}></div>

      {/* Main 3D Glass Card (Fixed, No Tilt) */}
      <div className="custom-glass-card z-10 w-[90%] max-w-[820px]">
        
        {/* LUXURY THEME SWITCH */}
        <div className="theme-switch-container" title="تبديل الوضع">
            <div 
              className="theme-switch" 
              onClick={() => setIsDark(!isDark)}
            ></div>
        </div>

        {/* 3D Logo (Right side due to RTL) */}
        <div className="logo-container">
            <img src="/logo.png" alt="شعار إنجاز" className="logo-3d" />
            <div className="divider"></div>
        </div>

        {/* Form (Left side due to RTL) */}
        <div className="form-section">
            <form onSubmit={handleLogin} className="text-right">
                <h2 className="text-3xl font-extrabold mb-8" style={{ color: 'var(--text-main)' }}>تسجيل الدخول</h2>
                
                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 backdrop-blur-md text-red-500 text-sm font-bold text-center">
                    {error}
                  </div>
                )}

                <div className="mb-5">
                    <label className="block text-xs font-bold mb-2" style={{ color: 'var(--text-main)' }}>اسم المستخدم</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="glass-input w-full py-4 px-6 rounded-2xl outline-none font-bold" 
                      placeholder="اسم المستخدم..."
                      required
                    />
                </div>

                <div className="mb-5">
                    <label className="block text-xs font-bold mb-2" style={{ color: 'var(--text-main)' }}>كلمة المرور</label>
                    <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="glass-input w-full py-4 px-6 rounded-2xl outline-none font-bold" 
                          placeholder="••••••••"
                          required
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-6 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                          style={{ color: 'var(--text-main)' }}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-10">
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded-lg bg-white/20" 
                        />
                        <span className="text-xs font-semibold opacity-70" style={{ color: 'var(--text-main)' }}>تذكرني</span>
                    </label>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="primary-btn w-full py-4 rounded-2xl font-bold text-lg disabled:opacity-70"
                >
                    {isLoading ? 'جاري التحقق...' : 'دخول بالمنظومة'}
                </button>

                <div className="mt-8 pt-4 border-t border-sky-500/10 text-center space-y-1 opacity-70 hover:opacity-100 transition-opacity">
                    <p className="text-[11px] font-bold" style={{ color: 'var(--text-main)' }}>
                        © {new Date().getFullYear()} منظومة إنجاز ويب. جميع الحقوق محفوظة.
                    </p>
                    <p className="text-[10px] font-bold italic" style={{ color: 'var(--credit-color)' }}>
                        تصميم وتطوير المهندس إدريس الهرى
                    </p>
                </div>
            </form>
        </div>

      </div>
      
      <style>{`
        .custom-glass-card {
            background: var(--card-bg);
            backdrop-filter: blur(30px) saturate(180%);
            -webkit-backdrop-filter: blur(30px) saturate(180%);
            border: 2px solid var(--card-border);
            border-radius: 3.5rem;
            box-shadow: 0 50px 120px rgba(0, 0, 0, 0.4);
            padding: 3rem;
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 4rem;
            position: relative;
        }

        /* --- LUXURY SWITCH --- */
        .theme-switch-container {
            position: absolute;
            top: 2rem;
            left: 2.5rem;
            z-index: 100;
        }

        .theme-switch {
            width: 70px;
            height: 34px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            position: relative;
            cursor: pointer;
            backdrop-filter: blur(10px);
            transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .theme-switch::after {
            content: "☀️";
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            position: absolute;
            top: 3px;
            left: 4px;
            width: 26px;
            height: 26px;
            background: linear-gradient(135deg, #0ea5e9, #0284c7);
            border-radius: 50%;
            transition: all 0.4s ease;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }

        .dark .theme-switch::after {
            left: 38px;
            content: "🌙";
            background: linear-gradient(135deg, #64748b, #1e293b);
        }

        .dark .theme-switch {
            background: rgba(15, 23, 42, 0.6);
            border-color: rgba(14, 165, 233, 0.4);
        }

        /* --- Elements --- */
        .logo-container {
            width: 35%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .logo-3d {
            width: 200px;
            animation: logo-hover 5s infinite ease-in-out;
            filter: drop-shadow(0 30px 40px rgba(0,0,0,0.3));
        }

        @keyframes logo-hover {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }

        .form-section {
            width: 65%;
            border-right: 1px solid rgba(14, 165, 233, 0.15);
            padding-right: 4rem;
        }

        /* --- Form Elements --- */
        .glass-input {
            background: var(--input-bg) !important;
            border: 1px solid var(--input-border);
            color: var(--input-text);
            transition: all 0.3s ease;
        }

        .glass-input:focus {
            border-color: #0ea5e9;
            box-shadow: 0 10px 25px rgba(14, 165, 233, 0.15);
        }

        .primary-btn {
            background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%);
            box-shadow: 0 20px 40px rgba(14, 165, 233, 0.3);
            color: white;
            transition: all 0.4s ease;
        }

        .primary-btn:hover:not(:disabled) {
            box-shadow: 0 30px 60px rgba(14, 165, 233, 0.4);
            transform: scale(1.02);
        }

        .divider {
            height: 2px;
            width: 100px;
            background: linear-gradient(90deg, transparent, #0ea5e9, transparent);
            margin: 1.5rem 0;
            opacity: 0.5;
        }

        .ltr { direction: ltr; }

        @media (max-width: 850px) {
            .custom-glass-card { flex-direction: column; gap: 2rem; padding: 2.5rem; text-align: center; }
            .logo-container, .form-section { width: 100%; border-right: none; padding-right: 0; }
            .theme-switch-container { top: 1rem; left: 1.5rem; }
        }
      `}</style>
    </div>
  );
};
