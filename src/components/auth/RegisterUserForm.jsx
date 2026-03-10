import React, { useState, useRef } from 'react';
import { Mail, Building2, KeyRound, Loader2, UserPlus, CheckCircle, AlertCircle, Eye, EyeOff, User, Briefcase, Phone } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import ModalPortal from '../modals/ModalPortal';

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

// --- ULTRA-COMPACT 12PX FLOATING LABEL INPUT ---
const FloatingInput = ({ id, label, icon: Icon, type = "text", value, onChange, required, disabled, minLength, rightElement, hasError }) => (
    <div className={`relative w-full shadow-sm rounded-lg border transition-all duration-300 overflow-hidden group ${
        disabled 
            ? 'bg-slate-50 border-slate-200' 
            : hasError 
                ? 'bg-red-50/30 border-red-300 focus-within:border-red-400 focus-within:ring-1 focus-within:ring-red-400'
                : 'bg-white border-slate-200 hover:border-slate-300 focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 focus-within:shadow-md'
    }`}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon size={14} className={`transition-colors duration-300 ${disabled ? 'text-slate-400' : 'text-slate-400 group-focus-within:text-slate-900 group-focus-within:scale-110'}`} />
        </div>
        <input
            type={type}
            id={id}
            required={required}
            disabled={disabled}
            minLength={minLength}
            className={`block w-full pl-8 pr-3 pt-4 pb-1.5 text-xs font-medium appearance-none focus:outline-none bg-transparent border-none ring-0 peer ${
                disabled ? 'text-slate-500 cursor-not-allowed' : 'text-slate-900'
            } ${rightElement ? 'pr-10' : ''}`}
            placeholder=" " 
            value={value || ''}
            onChange={onChange}
        />
        <label
            htmlFor={id}
            className={`absolute text-[9px] duration-300 transform -translate-y-1 top-2 z-10 origin-[0] left-8 
                peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0.5 peer-placeholder-shown:text-xs
                peer-focus:scale-100 peer-focus:-translate-y-1 pointer-events-none font-bold tracking-wide transition-all ${
                disabled ? 'text-slate-400' : hasError ? 'text-red-500' : 'text-slate-500 group-focus-within:text-slate-900'
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
  const supabaseClient = client || supabase;

  const [formData, setFormData] = useState({
    email: '', 
    password: '', 
    fullName: '', 
    designation: '', 
    contactNumber: '', 
    facility: '', // Placeholder logic
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

  const handlePreSubmit = (e) => {
    e.preventDefault();
    
    if (formData.password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
    }

    if (!formData.facility) {
        toast.error("Please select a facility for this user.");
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
             facility_name: formData.facility,
             role: formData.role
         });

         if (profileError) throw new Error("User created, but failed to assign facility and role.");

         toast.success("User and permissions created successfully");
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
        
        {/* --- ACCOUNT DETAILS --- */}
        <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Account Credentials</h4>
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
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 active:scale-90">
                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        }
                    />
                    {formData.password && (
                        <div className="animate-in fade-in slide-in-from-top-1 px-1">
                            <div className="flex gap-1 h-1 mb-1">
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <div key={level} className={`h-full flex-1 rounded-full transition-colors duration-300 ${strengthScore >= level ? strengthColors[strengthScore] : 'bg-slate-100'}`} />
                                ))}
                            </div>
                            <p className={`text-[9px] font-bold tracking-wide uppercase text-right ${strengthScore < 3 ? 'text-rose-500' : 'text-emerald-600'}`}>
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
                        <p className="text-[10px] text-rose-500 font-medium ml-2 animate-in fade-in slide-in-from-top-1">Passwords do not match</p>
                    )}
                </div>
            </div>
        </div>

        {/* --- PERSONAL DETAILS --- */}
        <div className="space-y-4 pt-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Profile Details</h4>
            
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

        {/* --- FACILITY ASSIGNMENT --- */}
        <div className="space-y-4 pt-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">System Access</h4>
            
            <div className={`relative w-full shadow-sm rounded-lg border transition-all duration-300 overflow-hidden group ${!formData.facility ? 'border-rose-200 bg-rose-50/20' : 'bg-white border-slate-200 hover:border-slate-300 focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 focus-within:shadow-md'}`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Building2 size={14} className={`transition-colors duration-300 ${!formData.facility ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-slate-900 group-focus-within:scale-110'}`} />
                </div>
                <label className={`absolute text-[9px] duration-300 transform -translate-y-1 top-2 z-10 origin-[0] left-8 pointer-events-none font-bold tracking-wide transition-all ${!formData.facility ? 'text-rose-500' : 'text-slate-500 group-focus-within:text-slate-900'}`}>
                    Assigned Facility <span className="text-red-500 ml-0.5">*</span>
                </label>
                <select 
                    required
                    value={formData.facility} 
                    onChange={e=>setFormData({...formData, facility: e.target.value})} 
                    className={`block w-full pl-8 pr-10 pt-4 pb-1.5 text-xs font-medium appearance-none focus:outline-none bg-transparent border-none ring-0 cursor-pointer ${formData.facility ? 'text-slate-900' : 'text-slate-400'}`}
                >
                    <option value="" disabled>Select a facility...</option>
                    {facilities.length > 0 ? (
                        facilities.map(f => <option key={f} value={f} className="text-slate-900">{f}</option>)
                    ) : (
                        <option value="" disabled>No available facilities</option>
                    )}
                </select>
                <div className={`absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none ${!formData.facility ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-slate-900'}`}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
            </div>
        </div>
        
        {/* Captcha */}
        <div className="flex justify-center mt-6">
            {HCAPTCHA_SITE_KEY ? (
                <HCaptcha ref={captcha} sitekey={HCAPTCHA_SITE_KEY} onVerify={(token) => setCaptchaToken(token)} />
            ) : (
                <div className="flex items-center gap-2 text-[11px] font-semibold text-rose-600 bg-rose-50 px-4 py-2 rounded-lg border border-rose-200">
                    <AlertCircle size={14}/> Warning: HCAPTCHA_SITE_KEY is missing
                </div>
            )}
        </div>

        {/* Submit Area */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4 mt-6">
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-semibold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                <AlertCircle size={12}/> Verify facility before creating
            </div>
            <button 
                type="submit" 
                disabled={loading} 
                className="w-full sm:w-auto bg-slate-900 text-yellow-400 px-6 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
                {loading ? <Loader2 size={16} className="animate-spin"/> : <UserPlus size={16}/>} 
                {loading ? 'Creating...' : 'Register Account'}
            </button>
        </div>
      </form>

      {/* --- CONFIRMATION MODAL --- */}
      {showConfirmModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                  <div className="flex flex-col items-center text-center">
                      <div className="bg-slate-100 p-4 rounded-full mb-5 text-slate-800 shadow-inner">
                          <UserPlus size={28} strokeWidth={2.5} />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Register User?</h3>
                      <p className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
                          Are you sure you want to create an account for <strong className="text-slate-900">{formData.fullName || formData.email}</strong> under the facility <strong className="text-slate-900">{formData.facility}</strong>?
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 w-full">
                          <button 
                              type="button"
                              onClick={() => setShowConfirmModal(false)} 
                              className="flex-1 py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all duration-200 order-2 sm:order-1"
                          >
                              Cancel
                          </button>
                          <button 
                              type="button"
                              onClick={confirmSubmit} 
                              className="flex-1 py-2.5 px-4 bg-slate-900 text-yellow-400 rounded-lg text-sm font-bold hover:bg-slate-800 shadow-sm active:scale-95 transition-all duration-200 flex justify-center items-center gap-2 order-1 sm:order-2"
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