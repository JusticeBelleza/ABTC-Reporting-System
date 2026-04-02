import React, { useState, useRef } from 'react';
import { Mail, Building2, KeyRound, Loader2, UserPlus, CheckCircle, AlertCircle, Eye, EyeOff, User, Briefcase, Phone, Shield, Wand2, Copy } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import ModalPortal from '../modals/ModalPortal';
import { useApp } from '../../context/AppContext';

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

// --- ULTRA-COMPACT 12PX FLOATING LABEL INPUT ---
const FloatingInput = ({ id, label, icon: Icon, type = "text", value, onChange, required, disabled, minLength, rightElement, hasError }) => (
    <div className={`relative w-full shadow-sm rounded-xl border transition-all duration-300 overflow-hidden group ${
        disabled 
            ? 'bg-slate-50 border-slate-200' 
            : hasError 
                ? 'bg-red-50/30 border-red-300 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-400/20'
                : 'bg-white border-slate-200 hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10'
    }`}>
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Icon size={16} className={`transition-colors duration-300 ${disabled ? 'text-slate-400' : 'text-slate-400 group-focus-within:text-blue-500'}`} />
        </div>
        <input
            type={type}
            id={id}
            required={required}
            disabled={disabled}
            minLength={minLength}
            className={`block w-full pl-10 pr-3 pt-5 pb-2 text-sm font-semibold appearance-none focus:outline-none bg-transparent border-none ring-0 peer ${
                disabled ? 'text-slate-500 cursor-not-allowed' : 'text-slate-900'
            } ${rightElement ? 'pr-10' : ''}`}
            placeholder=" " 
            value={value || ''}
            onChange={onChange}
        />
        <label
            htmlFor={id}
            className={`absolute text-[10px] duration-300 transform -translate-y-1.5 top-2.5 z-10 origin-[0] left-10
                peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium
                peer-focus:scale-100 peer-focus:-translate-y-1.5 peer-focus:text-[10px] peer-focus:font-bold pointer-events-none tracking-wide transition-all ${
                disabled ? 'text-slate-400' : hasError ? 'text-red-500' : 'text-slate-500 group-focus-within:text-blue-600'
            }`}
        >
            {label} {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20">
                {rightElement}
            </div>
        )}
    </div>
);

export default function RegisterUserForm({ facilities = [], client, onSuccess }) {
  const { user: currentUser } = useApp();
  const supabaseClient = client || supabase;

  const [formData, setFormData] = useState({
    email: '', 
    password: '', 
    fullName: '', 
    designation: '', 
    contactNumber: '', 
    facility: '', 
    role: 'user' 
  });
  
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [captchaToken, setCaptchaToken] = useState();
  const captcha = useRef();

  const calculateStrength = (pass) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length > 7) score += 1; 
    if (/[A-Z]/.test(pass)) score += 1; 
    if (/[a-z]/.test(pass)) score += 1; 
    if (/[0-9]/.test(pass)) score += 1; 
    if (/[^A-Za-z0-9]/.test(pass)) score += 1; 
    return score;
  };

  const strengthScore = calculateStrength(formData.password);
  const strengthColors = ['bg-slate-200', 'bg-rose-500', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-500', 'bg-emerald-600'];
  const strengthLabels = ['None', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];

  // --- AUTO GENERATE PASSWORD LOGIC ---
  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let randomPassword = "";
    for (let i = 0; i < 12; i++) {
        randomPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    setFormData({ ...formData, password: randomPassword });
    setConfirmPassword(randomPassword);
    setShowPassword(true);
    
    // Copy to clipboard
    navigator.clipboard.writeText(randomPassword).then(() => {
        toast.success("Secure password generated and copied to clipboard!");
    }).catch(() => {
        toast.success("Secure password generated!");
    });
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    
    if (formData.password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
    }

    if (formData.role === 'user' && !formData.facility) {
        toast.error("Please select an assigned facility for standard users.");
        return;
    }

    if (HCAPTCHA_SITE_KEY && !captchaToken) {
        toast.error("Please complete the captcha verification.");
        return;
    }

    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    try {
      if (!supabaseClient || !supabaseClient.auth) throw new Error("Supabase client is not initialized.");

      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { captchaToken }
      });

      if (authError) throw authError;
      
      if (authData.user) {
         const { error: profileError } = await supabase.from('profiles').upsert({
             id: authData.user.id,
             full_name: formData.fullName,
             designation: formData.designation,
             contact_number: formData.contactNumber, 
             facility_name: formData.facility || null,
             role: formData.role
         });

         if (profileError) throw new Error("User created, but failed to assign profile settings.");

         toast.success(`Account created successfully with ${formData.role.toUpperCase()} privileges.`);
         setFormData({ email: '', password: '', fullName: '', designation: '', contactNumber: '', facility: '', role: 'user' });
         setConfirmPassword('');
         
         if(onSuccess) onSuccess();
      } else {
         toast.info("User registration initiated. Check email for confirmation if required.");
      }

      if (captcha.current) captcha.current.resetCaptcha();
      setCaptchaToken(null);

    } catch (err) {
      console.error("Registration Error:", err);
      toast.error(err.message || "Failed to create user");
      if (captcha.current) captcha.current.resetCaptcha();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handlePreSubmit} className="space-y-6">
        
        {/* --- SECTION 1: SYSTEM ACCESS & ROLES --- */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            <div className="flex items-center gap-2 mb-4 text-slate-800">
                <Shield size={18} className="text-indigo-600" />
                <h4 className="text-sm font-extrabold tracking-tight">System Access Role</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ROLE SELECTOR */}
                <div className="relative w-full shadow-sm rounded-xl border transition-all duration-300 overflow-hidden group bg-white border-slate-200 hover:border-slate-300 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
                    <label className="absolute text-[10px] transform top-2 left-3 z-10 font-bold tracking-wide text-indigo-600">
                        Account Role <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <select 
                        required
                        value={formData.role} 
                        onChange={e => setFormData({...formData, role: e.target.value, facility: e.target.value === 'user' ? formData.facility : ''})} 
                        className="block w-full pl-3 pr-10 pt-6 pb-2 text-sm font-bold appearance-none focus:outline-none bg-transparent border-none ring-0 cursor-pointer text-slate-900"
                    >
                        <option value="user">Standard User (Encoder)</option>
                        {currentUser?.role === 'SYSADMIN' && (
                            <option value="admin">Administrator (Manager)</option>
                        )}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>

                {/* FACILITY SELECTOR */}
                <div className={`relative w-full shadow-sm rounded-xl border transition-all duration-300 overflow-hidden group ${formData.role === 'user' && !formData.facility ? 'border-rose-300 bg-rose-50/30 ring-2 ring-rose-500/20' : 'bg-white border-slate-200 hover:border-slate-300 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10'}`}>
                    <label className={`absolute text-[10px] transform top-2 left-3 z-10 font-bold tracking-wide ${formData.role === 'user' && !formData.facility ? 'text-rose-600' : 'text-indigo-600'}`}>
                        Assigned Facility {formData.role === 'user' && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <select 
                        required={formData.role === 'user'}
                        disabled={formData.role !== 'user'}
                        value={formData.facility} 
                        onChange={e=>setFormData({...formData, facility: e.target.value})} 
                        className={`block w-full pl-3 pr-10 pt-6 pb-2 text-sm font-bold appearance-none focus:outline-none bg-transparent border-none ring-0 cursor-pointer ${formData.facility || formData.role !== 'user' ? 'text-slate-900' : 'text-slate-400'} ${formData.role !== 'user' ? 'cursor-not-allowed opacity-60 bg-slate-50' : ''}`}
                    >
                        {formData.role !== 'user' ? (
                            <option value="">System-wide (No Facility)</option>
                        ) : (
                            <>
                                <option value="" disabled>Select a facility...</option>
                                {facilities.length > 0 ? (
                                    facilities.map(f => <option key={f} value={f} className="text-slate-900">{f}</option>)
                                ) : (
                                    <option value="" disabled>No available facilities</option>
                                )}
                            </>
                        )}
                    </select>
                    <div className={`absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none ${formData.role === 'user' && !formData.facility ? 'text-rose-400' : 'text-slate-400'}`}>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>
        </div>

        {/* --- SECTION 2: ACCOUNT CREDENTIALS --- */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 text-slate-800">
                    <KeyRound size={18} className="text-blue-600" />
                    <h4 className="text-sm font-extrabold tracking-tight">Login Credentials</h4>
                </div>
                <button 
                    type="button" 
                    onClick={generatePassword} 
                    className="text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-200 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                    <Wand2 size={14} /> Auto-Generate
                </button>
            </div>

            <div className="space-y-4">
                <FloatingInput 
                    id="email" 
                    label="Email Address" 
                    type="email"
                    icon={Mail} 
                    required 
                    value={formData.email} 
                    onChange={e=>setFormData({...formData, email: e.target.value})} 
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <FloatingInput 
                            id="password" 
                            type={showPassword ? "text" : "password"} 
                            label="Temporary Password" 
                            icon={KeyRound} 
                            required 
                            minLength={6}
                            value={formData.password} 
                            onChange={e=>setFormData({...formData, password: e.target.value})} 
                            rightElement={
                                <div className="flex items-center gap-1">
                                    {formData.password && (
                                        <button type="button" onClick={() => { navigator.clipboard.writeText(formData.password); toast.success("Copied to clipboard!"); }} className="text-slate-400 hover:text-blue-600 transition-colors p-1" title="Copy Password">
                                            <Copy size={14} />
                                        </button>
                                    )}
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-700 transition-colors p-1" title="Toggle Visibility">
                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            }
                        />
                        {formData.password && (
                            <div className="animate-in fade-in slide-in-from-top-1 px-1 mt-2">
                                <div className="flex gap-1 h-1.5 mb-1.5">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <div key={level} className={`h-full flex-1 rounded-full transition-colors duration-500 ${strengthScore >= level ? strengthColors[strengthScore] : 'bg-slate-200'}`} />
                                    ))}
                                </div>
                                <p className={`text-[10px] font-bold tracking-wide uppercase text-right ${strengthScore < 3 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                    {strengthLabels[strengthScore]}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <FloatingInput 
                            id="confirmPassword" 
                            type={showPassword ? "text" : "password"} 
                            label="Confirm Password" 
                            icon={KeyRound} 
                            required 
                            minLength={6}
                            value={confirmPassword} 
                            onChange={e=>setConfirmPassword(e.target.value)} 
                            hasError={confirmPassword && formData.password !== confirmPassword}
                        />
                        {confirmPassword && formData.password !== confirmPassword && (
                            <p className="text-[11px] text-rose-500 font-bold ml-2 animate-in fade-in slide-in-from-top-1 mt-1">Passwords do not match</p>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* --- SECTION 3: PERSONAL DETAILS --- */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <div className="flex items-center gap-2 mb-4 text-slate-800">
                <User size={18} className="text-emerald-600" />
                <h4 className="text-sm font-extrabold tracking-tight">Personal Details</h4>
            </div>
            
            <div className="space-y-4">
                <FloatingInput 
                    id="fullName" 
                    label="Full Name (Optional)" 
                    icon={User} 
                    value={formData.fullName} 
                    onChange={e=>setFormData({...formData, fullName: e.target.value})} 
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FloatingInput 
                        id="designation" 
                        label="Designation (Optional)" 
                        icon={Briefcase} 
                        value={formData.designation} 
                        onChange={e=>setFormData({...formData, designation: e.target.value})} 
                    />
                    
                    <FloatingInput 
                        id="contactNumber" 
                        label="Contact No. (Optional)" 
                        type="tel"
                        icon={Phone} 
                        value={formData.contactNumber} 
                        onChange={e=>setFormData({...formData, contactNumber: e.target.value})} 
                    />
                </div>
            </div>
        </div>

        
        {/* Captcha */}
        <div className="flex justify-center pt-2">
            {HCAPTCHA_SITE_KEY ? (
                <div className="rounded-xl overflow-hidden shadow-sm border border-slate-200">
                    <HCaptcha ref={captcha} sitekey={HCAPTCHA_SITE_KEY} onVerify={(token) => setCaptchaToken(token)} />
                </div>
            ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-rose-600 bg-rose-50 px-5 py-3 rounded-xl border border-rose-200 shadow-sm">
                    <AlertCircle size={16}/> Warning: Security Captcha Key Missing
                </div>
            )}
        </div>

        {/* Submit Area */}
        <div className="pt-2 flex items-center justify-between gap-4">
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold text-slate-500 bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200">
                <AlertCircle size={14}/> Verify role and facility assignments before creation.
            </div>
            <button 
                type="submit" 
                disabled={loading} 
                className="w-full sm:w-auto bg-slate-900 text-yellow-400 px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
                {loading ? <Loader2 size={18} className="animate-spin"/> : <UserPlus size={18}/>} 
                {loading ? 'Creating Account...' : 'Register Account'}
            </button>
        </div>
      </form>

      {/* --- CONFIRMATION MODAL --- */}
      {showConfirmModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                  <div className="flex flex-col items-center text-center">
                      <div className="bg-slate-100 p-5 rounded-full mb-6 text-slate-800 shadow-inner">
                          <UserPlus size={32} strokeWidth={2.5} />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Register {formData.role === 'user' ? 'Encoder' : 'Admin'}?</h3>
                      <p className="text-sm text-slate-500 mt-3 mb-8 leading-relaxed">
                          Are you sure you want to create a <strong className="text-slate-900">{formData.role.toUpperCase()}</strong> account for <strong className="text-slate-900">{formData.fullName || formData.email}</strong>?
                          {formData.role === 'user' && formData.facility && (
                              <span> They will be assigned to <strong className="text-slate-900">{formData.facility}</strong>.</span>
                          )}
                          {formData.role !== 'user' && (
                              <span> They will have province-wide management access.</span>
                          )}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 w-full">
                          <button 
                              type="button"
                              onClick={() => setShowConfirmModal(false)} 
                              className="flex-1 py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all duration-200 order-2 sm:order-1"
                          >
                              Cancel
                          </button>
                          <button 
                              type="button"
                              onClick={confirmSubmit} 
                              className="flex-1 py-3 px-4 bg-slate-900 text-yellow-400 rounded-xl text-sm font-black hover:bg-slate-800 shadow-md active:scale-95 transition-all duration-200 flex justify-center items-center gap-2 order-1 sm:order-2"
                          >
                              Confirm
                          </button>
                      </div>
                  </div>
              </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}