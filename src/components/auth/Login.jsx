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
      setResetMessage('Reset link sent. Please check your email.');
    } catch (err) { setError(err.message); } finally { 
      setLoading(false); 
      if (captcha.current) captcha.current.resetCaptcha();
      setCaptchaToken(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-8 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 p-8 sm:p-10 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Decorative Top Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></div>

        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-blue-50/50 text-blue-600 mb-5 shadow-inner border border-blue-100/50 transition-transform hover:scale-105 duration-300">
            <FileText size={32} strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">ABTC Reporting System</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">
            {isResetMode ? "Reset your password" : "Securely sign in to your account"}
          </p>
        </div>
        
        {/* Status Messages */}
        {error && (
            <div className="bg-rose-50 text-rose-600 p-3.5 rounded-xl text-sm mb-6 border border-rose-100 flex items-start gap-2.5 animate-in slide-in-from-top-2">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" /> 
                <span className="font-medium leading-tight">{error}</span>
            </div>
        )}
        
        {resetMessage && (
            <div className="bg-emerald-50 text-emerald-700 p-3.5 rounded-xl text-sm mb-6 border border-emerald-100 flex items-start gap-2.5 animate-in slide-in-from-top-2">
                <CheckCircle size={18} className="mt-0.5 flex-shrink-0" /> 
                <span className="font-medium leading-tight">{resetMessage}</span>
            </div>
        )}

        {/* Login Form */}
        {!isResetMode ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Email Address</label>
              <input 
                type="email" 
                required 
                className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 font-medium text-zinc-900 shadow-sm" 
                placeholder="name@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2 ml-1 mr-1">
                 <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Password</label>
                 <button 
                    type="button" 
                    onClick={() => { setIsResetMode(true); setError(''); setResetMessage(''); }} 
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider"
                 >
                    Forgot?
                 </button>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  className="w-full bg-gray-50 border border-gray-200 p-3.5 pr-12 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 font-medium text-zinc-900 shadow-sm" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-center py-2 scale-95 origin-center">
              <HCaptcha
                ref={captcha}
                sitekey={HCAPTCHA_SITE_KEY}
                onVerify={(token) => setCaptchaToken(token)}
              />
            </div>

            <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-zinc-900 text-white p-3.5 rounded-xl hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/20 active:scale-[0.98] transition-all text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin"/> : 'Sign In'}
            </button>
            
            <div className="text-center pt-4 border-t border-gray-100 mt-6">
               <p className="text-xs text-gray-400 font-medium">
                <br className="sm:hidden" />For ABTC facility registration and account creation, please contact the Program Coordinator.
               </p>
            </div>
          </form>
        ) : (
          
          /* Password Reset Form */
          <form onSubmit={handleResetPassword} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Account Email</label>
              <input 
                  type="email" 
                  required 
                  className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-zinc-900 shadow-sm" 
                  placeholder="Enter your email address"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
              />
            </div>
            
            <div className="flex justify-center py-2 scale-95 origin-center">
              <HCaptcha
                ref={captcha}
                sitekey={HCAPTCHA_SITE_KEY}
                onVerify={(token) => setCaptchaToken(token)}
              />
            </div>
            
            <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-zinc-900 text-white p-3.5 rounded-xl hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/20 active:scale-[0.98] transition-all text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin"/> : 'Send Reset Link'}
            </button>
            
            <div className="text-center pt-2">
              <button 
                  type="button" 
                  onClick={() => { setIsResetMode(false); setError(''); setResetMessage(''); }} 
                  className="text-xs font-bold text-gray-500 hover:text-zinc-900 uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 mx-auto p-2 rounded-lg hover:bg-gray-50"
              >
                  <ArrowLeft size={14} strokeWidth={2.5}/> Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}