import React, { useState, useRef } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

export default function RegisterUserForm({ facilities, client, onSuccess }) {
  const supabaseClient = client || supabase;

  const [formData, setFormData] = useState({
    email: '', 
    password: '', 
    fullName: '', 
    designation: '', 
    contactNumber: '', 
    facility: facilities[0] || '', 
    role: 'user' 
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState();
  const captcha = useRef();

  // Password Strength Logic
  const calculateStrength = (pass) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length > 7) score += 1; // Length
    if (/[A-Z]/.test(pass)) score += 1; // Uppercase
    if (/[a-z]/.test(pass)) score += 1; // Lowercase
    if (/[0-9]/.test(pass)) score += 1; // Number
    if (/[^A-Za-z0-9]/.test(pass)) score += 1; // Special Character
    return score;
  };

  const strengthScore = calculateStrength(formData.password);
  const strengthColors = ['bg-gray-200', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];
  const strengthLabels = ['None', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
    }

    if (HCAPTCHA_SITE_KEY && !captchaToken) {
        toast.error("Please complete the captcha verification.");
        return;
    }

    setLoading(true);

    try {
      if (!supabaseClient || !supabaseClient.auth) {
          throw new Error("Supabase client is not initialized.");
      }

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
         setFormData({ email: '', password: '', fullName: '', designation: '', contactNumber: '', facility: facilities[0] || '', role: 'user' });
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
    <form onSubmit={handleSubmit} className="space-y-4">
       <div>
         <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
         <input type="email" required value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-zinc-900" />
       </div>

       <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required minLength={6} 
                value={formData.password} 
                onChange={e=>setFormData({...formData, password: e.target.value})} 
                className="w-full border border-gray-200 p-2 pr-9 rounded-lg text-sm outline-none focus:border-zinc-900" 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Password Strength Meter */}
            {formData.password && (
              <div className="mt-1.5">
                <div className="flex gap-1 h-1 mb-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div key={level} className={`h-full flex-1 rounded-full transition-colors ${strengthScore >= level ? strengthColors[strengthScore] : 'bg-gray-200'}`} />
                  ))}
                </div>
                <p className={`text-[10px] font-medium text-right ${strengthScore < 3 ? 'text-red-500' : 'text-green-600'}`}>
                  {strengthLabels[strengthScore]}
                </p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required minLength={6} 
                value={confirmPassword} 
                onChange={e=>setConfirmPassword(e.target.value)} 
                className={`w-full border p-2 pr-9 rounded-lg text-sm outline-none focus:border-zinc-900 ${confirmPassword && formData.password !== confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} 
              />
            </div>
            {confirmPassword && formData.password !== confirmPassword && (
                <p className="text-[10px] text-red-500 mt-1 font-medium">Passwords do not match</p>
            )}
          </div>
       </div>

       <div>
         <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
         <input type="text" required value={formData.fullName} onChange={e=>setFormData({...formData, fullName: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-zinc-900" />
       </div>
       <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Designation</label>
            <input type="text" value={formData.designation} onChange={e=>setFormData({...formData, designation: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-zinc-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Contact No.</label>
            <input type="text" value={formData.contactNumber} onChange={e=>setFormData({...formData, contactNumber: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-zinc-900" />
          </div>
       </div>
       
       <div className="grid grid-cols-1 gap-4">
         <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Facility</label>
            <select value={formData.facility} onChange={e=>setFormData({...formData, facility: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-zinc-900">
               {facilities.length > 0 ? facilities.map(f => <option key={f} value={f}>{f}</option>) : <option value="">No available facilities</option>}
            </select>
         </div>
       </div>
       
       <div className="flex justify-center my-4">
          {HCAPTCHA_SITE_KEY ? (
              <HCaptcha ref={captcha} sitekey={HCAPTCHA_SITE_KEY} onVerify={(token) => setCaptchaToken(token)} />
          ) : (
              <p className="text-xs text-red-500 bg-red-50 p-2 rounded">Warning: VITE_HCAPTCHA_SITE_KEY is missing in .env</p>
          )}
       </div>

       <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white p-2.5 rounded-lg hover:bg-zinc-800 transition text-sm font-medium flex justify-center items-center gap-2">
           {loading && <Loader2 size={16} className="animate-spin"/>} 
           {loading ? 'Creating...' : 'Create User'}
       </button>
    </form>
  );
}