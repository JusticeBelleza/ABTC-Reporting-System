import React, { useState, useEffect } from 'react';
import { X, Loader2, Save, UserPlus, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext'; // Import Context
import { toast } from 'sonner';

export default function UserManagementModal({ isOpen, onClose }) {
  // Get the Dynamic Facility List from Context
  const { facilities } = useApp(); 
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    fullName: '', 
    role: 'user', 
    facility: '' 
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) fetchUsers();
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles instead of auth users (client-side limitation workaround)
      // This assumes you have a public 'profiles' table that mirrors auth users
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // 1. Create the Auth User
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role,
            // CRITICAL: This links the User to the Facility
            facility_name: formData.facility 
          }
        }
      });

      if (error) throw error;

      // 2. Setup Profile (if not handled by Database Triggers)
      // We manually insert to profiles to ensure immediate visibility in the list
      if (data?.user) {
         const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: data.user.id,
                email: formData.email,
                full_name: formData.fullName,
                role: formData.role,
                facility_name: formData.facility,
                created_at: new Date().toISOString()
            });
         
         if (profileError) console.error("Profile creation warning:", profileError);
      }

      toast.success(`User ${formData.fullName} created successfully`);
      
      // Reset form
      setFormData({ email: '', password: '', fullName: '', role: 'user', facility: '' });
      fetchUsers();

    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">User Management</h2>
            <p className="text-sm text-gray-500">Create and manage system access</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT: Create User Form */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-4">
                  <UserPlus size={18} />
                  Add New User
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-blue-800 mb-1">Full Name</label>
                    <input 
                      type="text" required
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                      className="w-full text-sm p-2 rounded border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-blue-800 mb-1">Email</label>
                    <input 
                      type="email" required
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full text-sm p-2 rounded border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-blue-800 mb-1">Password</label>
                    <input 
                      type="password" required minLength={6}
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full text-sm p-2 rounded border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-blue-800 mb-1">Role</label>
                      <select 
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                        className="w-full text-sm p-2 rounded border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    {/* DYNAMIC FACILITY DROPDOWN */}
                    <div>
                      <label className="block text-xs font-medium text-blue-800 mb-1">Facility</label>
                      <select 
                        value={formData.facility}
                        onChange={e => setFormData({...formData, facility: e.target.value})}
                        disabled={formData.role === 'admin'}
                        className="w-full text-sm p-2 rounded border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="">Select...</option>
                        {/* Iterate over the dynamic list from Context */}
                        {facilities.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={processing}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm font-medium shadow-sm"
                  >
                    {processing ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Create Account
                  </button>
                </form>
              </div>
            </div>

            {/* RIGHT: User List */}
            <div className="lg:col-span-2">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                Existing Users
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600 font-normal">
                  {users.length}
                </span>
              </h3>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Assigned Facility</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{user.full_name || 'No Name'}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs border ${
                              user.role === 'admin' 
                                ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {user.role === 'admin' ? (
                              <span className="text-gray-400 italic">Global Access</span>
                            ) : (
                              user.facility_name || <span className="text-red-400 flex items-center gap-1"><AlertCircle size={12}/> Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                             {/* Delete logic would go here */}
                             <button className="text-gray-300 hover:text-red-500 transition">
                                <Trash2 size={16} />
                             </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}