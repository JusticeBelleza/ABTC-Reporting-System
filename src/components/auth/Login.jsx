import React, { useState, useRef } from 'react';
import { Loader2, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
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
      const { error } = await supabase.auth.signInWithPassword({ 
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
    <div className="min-h-screen bg-slate-50 relative flex items-center justify-center p-4 sm:p-8 font-sans selection:bg-yellow-200 selection:text-black overflow-hidden">
      
      {/* The Structured Geometric Background - Deep Slate */}
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-slate-900 [clip-path:polygon(0_0,100%_0,100%_75%,0_100%)] z-0"></div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-100 p-8 sm:p-10 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header Section */}
        <div className="mb-8 text-center">
          {/* PHO Logo Image */}
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white mb-4 shadow-sm border border-slate-100">
            <img 
              src="/images/pho-logo.png" 
              alt="PHO Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-black tracking-tight">ABTC Reporting System</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            {isResetMode ? "Reset your password" : "Securely sign in to your account"}
          </p>
        </div>
        
        {/* Status Messages */}
        {error && (
            <div className="bg-rose-50 text-rose-600 p-3.5 rounded-lg text-sm mb-6 border border-rose-100 flex items-start gap-2.5 animate-in slide-in-from-top-2">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" /> 
                <span className="font-medium leading-tight">{error}</span>
            </div>
        )}
        
        {resetMessage && (
            <div className="bg-emerald-50 text-emerald-700 p-3.5 rounded-lg text-sm mb-6 border border-emerald-100 flex items-start gap-2.5 animate-in slide-in-from-top-2">
                <CheckCircle size={18} className="mt-0.5 flex-shrink-0" /> 
                <span className="font-medium leading-tight">{resetMessage}</span>
            </div>
        )}

        {/* Login Form */}
        {!isResetMode ? (
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Floating Label Email Input */}
            <div className="relative">
              <input 
                type="email" 
                id="email"
                required 
                className="peer block w-full px-3.5 pb-2.5 pt-6 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all font-medium text-black shadow-sm appearance-none" 
                placeholder=" " 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
              <label 
                htmlFor="email" 
                className="absolute duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] start-3.5 text-black peer-focus:text-black peer-placeholder-shown:text-slate-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 cursor-text font-medium"
              >
                Email Address
              </label>
            </div>
            
            {/* Floating Label Password Input */}
            <div>
              <div className="flex justify-end mb-1 mr-1">
                 <button 
                    type="button" 
                    onClick={() => { setIsResetMode(true); setError(''); setResetMessage(''); }} 
                    className="text-[11px] font-bold text-slate-500 hover:text-black transition-colors uppercase tracking-wider"
                 >
                    Forgot Password?
                 </button>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password"
                  required 
                  className="peer block w-full px-3.5 pb-2.5 pt-6 pr-12 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all font-medium text-black shadow-sm appearance-none" 
                  placeholder=" " 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
                <label 
                  htmlFor="password" 
                  className="absolute duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] start-3.5 text-black peer-focus:text-black peer-placeholder-shown:text-slate-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 cursor-text font-medium"
                >
                  Password
                </label>
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black transition-colors p-1"
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

            {/* Bright Yellow Button */}
            <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-yellow-400 text-black p-3.5 rounded-lg hover:bg-yellow-500 hover:shadow-lg hover:shadow-yellow-400/20 active:scale-[0.98] transition-all text-sm font-bold flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin"/> : 'Sign In'}
            </button>
            
            <div className="text-center pt-4 border-t border-slate-100 mt-6">
               <p className="text-xs text-slate-400 font-medium">
                <br className="sm:hidden" />For ABTC facility registration and account creation, please contact the Program Coordinator.
               </p>
            </div>
          </form>
        ) : (
          
          /* Password Reset Form */
          <form onSubmit={handleResetPassword} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            {/* Floating Label Email Input for Reset Mode */}
            <div className="relative">
              <input 
                  type="email" 
                  id="reset-email"
                  required 
                  className="peer block w-full px-3.5 pb-2.5 pt-6 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all font-medium text-black shadow-sm appearance-none" 
                  placeholder=" "
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
              />
               <label 
                htmlFor="reset-email" 
                className="absolute duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] start-3.5 text-black peer-focus:text-black peer-placeholder-shown:text-slate-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 cursor-text font-medium"
              >
                Account Email
              </label>
            </div>
            
            <div className="flex justify-center py-2 scale-95 origin-center">
              <HCaptcha
                ref={captcha}
                sitekey={HCAPTCHA_SITE_KEY}
                onVerify={(token) => setCaptchaToken(token)}
              />
            </div>
            
            {/* Bright Yellow Button */}
            <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-yellow-400 text-black p-3.5 rounded-lg hover:bg-yellow-500 hover:shadow-lg hover:shadow-yellow-400/20 active:scale-[0.98] transition-all text-sm font-bold flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin"/> : 'Send Reset Link'}
            </button>
            
            <div className="text-center pt-2">
              <button 
                  type="button" 
                  onClick={() => { setIsResetMode(false); setError(''); setResetMessage(''); }} 
                  className="text-xs font-bold text-slate-500 hover:text-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 mx-auto p-2 rounded-lg hover:bg-slate-50"
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