import React, { useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { toast } from 'sonner';
// IMPORT SUPABASE AS A FALLBACK
import { supabase } from '../../lib/supabase';

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

export default function RegisterUserForm({ facilities, client, onSuccess }) {
  // Use the passed client, or fallback to the imported default instance
  const supabaseClient = client || supabase;

  const [formData, setFormData] = useState({
    email: '', 
    password: '', 
    fullName: '', 
    designation: '', 
    contactNumber: '', 
    facility: facilities[0] || '', 
    role: 'user' // Default to user, since admin option is removed
  });
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState();
  const captcha = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. CAPTCHA CHECK: Prevent submission if Captcha is required but missing
    if (HCAPTCHA_SITE_KEY && !captchaToken) {
        toast.error("Please complete the captcha verification.");
        return;
    }

    setLoading(true);

    try {
      // 2. CLIENT CHECK: Ensure we have a valid client
      if (!supabaseClient || !supabaseClient.auth) {
          throw new Error("Supabase client is not initialized.");
      }

      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          captchaToken,
          // DATA PASSED HERE IS ACCESSIBLE VIA raw_user_meta_data IN SQL
          data: { 
            full_name: formData.fullName,
            designation: formData.designation,      
            phone_number: formData.contactNumber,   
            facility_name: formData.facility,
            role: formData.role
          }
        }
      });

      if (authError) throw authError;
      
      if (authData.user) {
         toast.success("User created successfully");
         // Reset form
         setFormData({
            email: '', 
            password: '', 
            fullName: '', 
            designation: '', 
            contactNumber: '', 
            facility: facilities[0] || '', 
            role: 'user'
         });
         
         // Notify parent and potentially unmount this component
         if(onSuccess) onSuccess();
      } else {
         // Edge case: User created but session/user object is null (e.g. email confirm required)
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
      // 3. STOP LOADING
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
       <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-zinc-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required minLength={6} value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-zinc-900" />
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
       
       {/* Removed Role Dropdown and adjusted grid to single column for Facility */}
       <div className="grid grid-cols-1 gap-4">
         <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Facility</label>
            <select value={formData.facility} onChange={e=>setFormData({...formData, facility: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-zinc-900">
               {facilities.length > 0 ? (
                   facilities.map(f => <option key={f} value={f}>{f}</option>)
               ) : (
                   <option value="">No available facilities</option>
               )}
            </select>
         </div>
       </div>
       
       <div className="flex justify-center my-4">
          {HCAPTCHA_SITE_KEY ? (
              <HCaptcha
                ref={captcha}
                sitekey={HCAPTCHA_SITE_KEY}
                onVerify={(token) => {
                    setCaptchaToken(token)
                }}
              />
          ) : (
              <p className="text-xs text-red-500 bg-red-50 p-2 rounded">
                  Warning: VITE_HCAPTCHA_SITE_KEY is missing in .env
              </p>
          )}
       </div>

       <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white p-2.5 rounded-lg hover:bg-zinc-800 transition text-sm font-medium flex justify-center items-center gap-2">
           {loading && <Loader2 size={16} className="animate-spin"/>} 
           {loading ? 'Creating...' : 'Create User'}
       </button>
    </form>
  );
}