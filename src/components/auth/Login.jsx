import React, { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Loader2, FileText, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { supabase } from '../../lib/supabase';

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  
  const [captchaToken, setCaptchaToken] = useState();
  const captcha = useRef();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
        options: { captchaToken }
      });

      if (error) throw error;
      localStorage.setItem('abtc_login_time', Date.now().toString());

    } catch (err) {
      setError(err.message);
      if (captcha.current) captcha.current.resetCaptcha();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResetMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { 
        redirectTo: window.location.origin,
        captchaToken
      });
      if (error) throw error;
      setResetMessage('Reset link sent.');
    } catch (err) { setError(err.message); } finally { 
      setLoading(false); 
      if (captcha.current) captcha.current.resetCaptcha();
      setCaptchaToken(null);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-in fade-in zoom-in duration-300">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-gray-50 text-zinc-900 mb-4 ring-1 ring-gray-200">
            <FileText size={32} strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">ABTC-Reporting System</h1>
          <p className="text-sm text-gray-500 mt-1 italic">For ABTC facility registration and account creation, please contact the Program Coordinator.</p>
        </div>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded text-xs mb-6 border border-red-100 flex gap-2"><AlertCircle size={14}/> {error}</div>}
        {resetMessage && <div className="bg-green-50 text-green-600 p-3 rounded text-xs mb-6 border border-green-100 flex gap-2"><CheckCircle size={14}/> {resetMessage}</div>}

        {!isResetMode ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Email address</label>
              <input type="email" required className="w-full bg-white border border-gray-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all placeholder:text-gray-300" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  className="w-full bg-white border border-gray-200 p-2.5 pr-10 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all placeholder:text-gray-300" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-center py-2">
              <HCaptcha
                ref={captcha}
                sitekey={HCAPTCHA_SITE_KEY}
                onVerify={(token) => setCaptchaToken(token)}
              />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white p-2.5 rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin"/> : 'Sign In'}
            </button>
            <div className="text-center pt-2">
              <button type="button" onClick={() => { setIsResetMode(true); setError(''); setResetMessage(''); }} className="text-xs text-gray-500 hover:text-zinc-900 transition-colors">Forgot password?</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
             <div className="text-center mb-6">
               <h3 className="font-medium text-zinc-900">Reset Password</h3>
               <p className="text-xs text-gray-500 mt-1">We'll send you a link to reset it.</p>
             </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Email address</label>
              <input type="email" required className="w-full bg-white border border-gray-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="flex justify-center py-2">
              <HCaptcha
                ref={captcha}
                sitekey={HCAPTCHA_SITE_KEY}
                onVerify={(token) => setCaptchaToken(token)}
              />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white p-2.5 rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin"/> : 'Send Link'}
            </button>
            <div className="text-center pt-2">
              <button type="button" onClick={() => { setIsResetMode(false); setError(''); setResetMessage(''); }} className="text-xs text-gray-500 hover:text-zinc-900 flex items-center justify-center gap-1"><ArrowLeft size={12}/> Back to Login</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}