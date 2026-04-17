import React, { useState, useRef } from 'react';
import { Mail, KeyRound, Loader2, UserPlus, AlertCircle, Eye, EyeOff, User, Briefcase, Phone, Shield, Wand2, Copy } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile'; // --- UPDATED IMPORT ---
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import ModalPortal from '../modals/ModalPortal';
import { useApp } from '../../context/AppContext';

// --- UPDATED ENV VARIABLE ---
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

// --- COMPACT FLOATING LABEL INPUT ---
const FloatingInput = ({ id, label, icon: Icon, type = "text", value, onChange, required, disabled, minLength, rightElement, hasError }) => (
    <div className={`relative w-full shadow-sm rounded-lg border transition-all duration-300 overflow-hidden group ${
        disabled 
            ? 'bg-slate-50 border-slate-200' 
            : hasError 
                ? 'bg-red-50/30 border-red-300 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-400/20'
                : 'bg-white border-slate-200 hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10'
    }`}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon size={14} className={`transition-colors duration-300 ${disabled ? 'text-slate-400' : 'text-slate-400 group-focus-within:text-blue-500'}`} />
        </div>
        <input
            type={type}
            id={id}
            required={required}
            disabled={disabled}
            minLength={minLength}
            className={`block w-full pl-9 pr-3 pt-5 pb-1.5 text-sm font-semibold appearance-none focus:outline-none bg-transparent border-none ring-0 peer ${
                disabled ? 'text-slate-500 cursor-not-allowed' : 'text-slate-900'
            } ${rightElement ? 'pr-10' : ''}`}
            placeholder=" " 
            value={value || ''}
            onChange={onChange}
        />
        <label
            htmlFor={id}
            className={`absolute text-[10px] duration-300 transform -translate-y-1.5 top-2.5 z-10 origin-[0] left-9
                peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-placeholder-shown:text-xs peer-placeholder-shown:font-medium
                peer-focus:scale-100 peer-focus:-translate-y-1.5 peer-focus:text-[10px] peer-focus:font-bold pointer-events-none tracking-wide transition-all ${
                disabled ? 'text-slate-400' : hasError ? 'text-red-500' : 'text-slate-500 group-focus-within:text-blue-600'
            }`}
        >
            {label} {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {rightElement && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20">
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
    role: '' 
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [captchaToken, setCaptchaToken] = useState();
  const captcha = useRef();

  // --- AUTO GENERATE PASSWORD: User@ + 4 Random Numbers ---
  const generatePassword = () => {
    // Generate a random 4-digit number between 1000 and 9999
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    const newPassword = `User@${randomNumber}`;
    
    setFormData({ ...formData, password: newPassword });
    setShowPassword(true); // Automatically reveal the password so the admin can see it
    
    // Copy to clipboard
    navigator.clipboard.writeText(newPassword).then(() => {
        toast.success("Password generated and copied to clipboard!");
    }).catch(() => {
        toast.success("Password generated!");
    });
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();

    if (!formData.role) {
        toast.error("Please select an Account Role.");
        return;
    }

    if (formData.role === 'user' && !formData.facility) {
        toast.error("Please select an assigned facility for standard users.");
        return;
    }

    if (TURNSTILE_SITE_KEY && !captchaToken) {
        toast.error("Please complete the security verification.");
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
         setFormData({ email: '', password: '', fullName: '', designation: '', contactNumber: '', facility: '', role: '' });
         
         if(onSuccess) onSuccess();
      } else {
         toast.info("User registration initiated. Check email for confirmation if required.");
      }

      // --- UPDATED RESET METHOD ---
      if (captcha.current) captcha.current.reset();
      setCaptchaToken(null);

    } catch (err) {
      console.error("Registration Error:", err);
      toast.error(err.message || "Failed to create user");
      // --- UPDATED RESET METHOD ---
      if (captcha.current) captcha.current.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handlePreSubmit} className="space-y-6">
        
        {/* --- SYSTEM ACCESS --- */}
        <div>
            <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2"><Shield size={14}/> System Access</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* ROLE SELECTOR */}
                <div className="relative w-full shadow-sm rounded-lg border transition-all duration-300 overflow-hidden group bg-white border-slate-200 hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10">
                    <label className={`absolute text-[10px] transform top-1.5 left-3 z-10 font-bold tracking-wide ${!formData.role ? 'text-rose-500' : 'text-slate-500 group-focus-within:text-blue-600'}`}>
                        Account Role <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <select 
                        required
                        value={formData.role} 
                        onChange={e => {
                            const newRole = e.target.value;
                            // Automatically assign 'PHO' if Admin is selected
                            setFormData({
                                ...formData, 
                                role: newRole, 
                                facility: newRole === 'admin' ? 'PHO' : (newRole === 'user' ? formData.facility : '')
                            });
                        }} 
                        className={`block w-full pl-3 pr-10 pt-5 pb-1.5 text-sm font-bold appearance-none focus:outline-none bg-transparent border-none ring-0 cursor-pointer ${formData.role ? 'text-slate-900' : 'text-slate-400'}`}
                    >
                        <option value="" disabled>Select a role...</option>
                        {currentUser?.role === 'SYSADMIN' && (
                            <option value="admin" className="text-slate-900">Administrator</option>
                        )}
                        <option value="user" className="text-slate-900">Standard User</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>

                {/* FACILITY SELECTOR */}
                <div className={`relative w-full shadow-sm rounded-lg border transition-all duration-300 overflow-hidden group ${formData.role === 'user' && !formData.facility ? 'border-rose-300 bg-rose-50/30' : 'bg-white border-slate-200 hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10'}`}>
                    <label className={`absolute text-[10px] transform top-1.5 left-3 z-10 font-bold tracking-wide ${formData.role === 'user' && !formData.facility ? 'text-rose-500' : 'text-slate-500 group-focus-within:text-blue-600'}`}>
                        Assigned Facility {formData.role === 'user' && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <select 
                        required={formData.role === 'user'}
                        disabled={formData.role !== 'user'}
                        value={formData.facility} 
                        onChange={e=>setFormData({...formData, facility: e.target.value})} 
                        className={`block w-full pl-3 pr-10 pt-5 pb-1.5 text-sm font-bold appearance-none focus:outline-none bg-transparent border-none ring-0 cursor-pointer ${formData.facility || formData.role !== 'user' ? 'text-slate-900' : 'text-slate-400'} ${formData.role !== 'user' ? 'cursor-not-allowed opacity-60 bg-slate-50' : ''}`}
                    >
                        {formData.role === 'admin' ? (
                            <option value="PHO">Provincial Health Office (PHO)</option>
                        ) : formData.role === 'SYSADMIN' ? (
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

        {/* --- CREDENTIALS --- */}
        <div>
            <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2"><KeyRound size={14}/> Credentials</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <FloatingInput 
                    id="email" 
                    label="Email Address" 
                    type="email"
                    icon={Mail} 
                    required 
                    value={formData.email} 
                    onChange={e=>setFormData({...formData, email: e.target.value})} 
                />

                <div className="flex flex-col gap-2">
                    <FloatingInput 
                        id="password" 
                        type={showPassword ? "text" : "password"} 
                        label="Password" 
                        icon={KeyRound} 
                        required 
                        minLength={6}
                        value={formData.password} 
                        onChange={e=>setFormData({...formData, password: e.target.value})} 
                        rightElement={
                            <div className="flex items-center gap-0.5 bg-white pl-1">
                                {formData.password && (
                                    <button type="button" onClick={() => { navigator.clipboard.writeText(formData.password); toast.success("Copied!"); }} className="p-1 text-slate-400 hover:text-blue-600 transition-colors bg-white" title="Copy Password">
                                        <Copy size={14} />
                                    </button>
                                )}
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1 text-slate-400 hover:text-slate-700 transition-colors bg-white mr-1" title="Toggle Visibility">
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        }
                    />
                    <div className="flex justify-end">
                        <button 
                            type="button" 
                            onClick={generatePassword} 
                            className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                        >
                            <Wand2 size={14}/> Auto-Generate Password
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* --- PROFILE DETAILS --- */}
        <div>
            <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2"><User size={14}/> Profile Details</h4>
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

        {/* --- CAPTCHA & SUBMIT --- */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4">
            <div className="w-full sm:w-auto overflow-hidden rounded-lg">
                {TURNSTILE_SITE_KEY ? (
                    /* --- UPDATED TURNSTILE COMPONENT --- */
                    <Turnstile
                      ref={captcha}
                      siteKey={TURNSTILE_SITE_KEY}
                      onSuccess={(token) => setCaptchaToken(token)}
                      options={{ theme: 'light', size: 'normal' }}
                    />
                ) : (
                    <div className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={12}/> Security Disabled
                    </div>
                )}
            </div>

            <button 
                type="submit" 
                disabled={loading} 
                className="w-full sm:w-auto bg-slate-900 text-white px-8 py-3 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 size={16} className="animate-spin"/> : <UserPlus size={16}/>} 
                {loading ? 'Creating...' : 'Register Account'}
            </button>
        </div>
      </form>

      {/* --- CONFIRMATION MODAL --- */}
      {showConfirmModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                  <div className="flex flex-col items-center text-center">
                      <div className="bg-slate-100 p-4 rounded-full mb-5 text-slate-800 shadow-inner">
                          <UserPlus size={28} strokeWidth={2.5} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">Register {formData.role === 'user' ? 'Encoder' : 'Admin'}?</h3>
                      <p className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
                          Are you sure you want to create an account for <strong className="text-slate-900">{formData.fullName || formData.email}</strong>?
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 w-full">
                          <button 
                              type="button"
                              onClick={() => setShowConfirmModal(false)} 
                              className="flex-1 py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all order-2 sm:order-1"
                          >
                              Cancel
                          </button>
                          <button 
                              type="button"
                              onClick={confirmSubmit} 
                              className="flex-1 py-2.5 px-4 bg-slate-900 text-white rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-all flex justify-center items-center gap-2 order-1 sm:order-2"
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