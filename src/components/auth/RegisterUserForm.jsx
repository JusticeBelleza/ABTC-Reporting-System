import React, { useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { toast } from 'sonner';

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

// Added 'export default' here:
export default function RegisterUserForm({ facilities, client, onSuccess }) {
  const [formData, setFormData] = useState({
    email: '', password: '', fullName: '', designation: '', contactNumber: '', facility: facilities[0] || '', role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState();
  const captcha = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: authData, error: authError } = await client.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          captchaToken,
          data: { 
            full_name: formData.fullName,
            facility_name: formData.facility,
            role: formData.role
          }
        }
      });
      if (authError) throw authError;
      
      if (authData.user) {
         toast.success("User created successfully");
         if(onSuccess) onSuccess();
      }
      if (captcha.current) captcha.current.resetCaptcha();
      setCaptchaToken(null);
    } catch (err) {
      toast.error(err.message);
      if (captcha.current) captcha.current.resetCaptcha();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
       <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Email</label><input type="email" required value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-zinc-900" /></div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Password</label><input type="password" required minLength={6} value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-zinc-900" /></div>
       </div>
       <div><label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label><input type="text" required value={formData.fullName} onChange={e=>setFormData({...formData, fullName: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-zinc-900" /></div>
       <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Designation</label><input type="text" value={formData.designation} onChange={e=>setFormData({...formData, designation: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-zinc-900" /></div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Contact No.</label><input type="text" value={formData.contactNumber} onChange={e=>setFormData({...formData, contactNumber: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-zinc-900" /></div>
       </div>
       <div className="grid grid-cols-2 gap-4">
         <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Facility</label>
            <select value={formData.facility} onChange={e=>setFormData({...formData, facility: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-zinc-900">
               {facilities.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
         </div>
         <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
            <select value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-zinc-900">
               <option value="user">User</option>
               <option value="admin">Admin</option>
            </select>
         </div>
       </div>
       <div className="flex justify-center my-4">
          <HCaptcha
            ref={captcha}
            sitekey={HCAPTCHA_SITE_KEY}
            onVerify={(token) => {
                setCaptchaToken(token)
            }}
          />
       </div>
       <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white p-2.5 rounded-lg hover:bg-zinc-800 transition text-sm font-medium flex justify-center items-center gap-2">{loading && <Loader2 size={16} className="animate-spin"/>} Create User</button>
    </form>
  );
}