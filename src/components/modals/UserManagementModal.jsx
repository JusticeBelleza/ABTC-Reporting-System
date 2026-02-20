import React, { useState, useEffect } from 'react';
import { Users, X, Loader2, Edit, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import RegisterUserForm from '../auth/RegisterUserForm'; 
import ProfileModal from './ProfileModal';

export default function UserManagementModal({ onClose, facilities, client }) {
  const [activeTab, setActiveTab] = useState('list'); 
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const effectiveClient = client || supabase;

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await effectiveClient.from('profiles').select('*');
    if (data) {
        const sorted = data.sort((a, b) => {
            if (a.role === 'admin' && b.role !== 'admin') return -1;
            if (a.role !== 'admin' && b.role === 'admin') return 1;
            return new Date(b.created_at) - new Date(a.created_at);
        });
        setUsers(sorted);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const assignedFacilities = users.map(u => u.facility_name).filter(Boolean);
  const availableFacilities = facilities.filter(f => !assignedFacilities.includes(f));

  const initiateDelete = (user) => { setUserToDelete(user); };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      const { error } = await effectiveClient.rpc('delete_user_by_id', { target_user_id: userToDelete.id });
      if (error) throw error;
      toast.success("User deleted");
      fetchUsers();
    } catch(err) { toast.error("Error: " + err.message); }
    setIsDeletingUser(false);
    setUserToDelete(null);
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      
      {/* Edit Profile Sub-Modal */}
      {editingUserId && <ProfileModal userId={editingUserId} onClose={() => { setEditingUserId(null); fetchUsers(); }} />}
      
      {/* Delete Confirmation Sub-Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                 <div className="flex flex-col items-center text-center">
                    <div className="bg-red-50 p-4 rounded-full mb-5 text-red-600 shadow-inner">
                        <AlertCircle size={28} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">Delete User?</h3>
                    <p className="text-sm text-gray-500 mt-2 mb-6 leading-relaxed">
                        Are you sure you want to delete <span className="font-semibold text-zinc-900">{userToDelete.full_name || userToDelete.email}</span>? This action removes their access completely and cannot be undone.
                    </p>
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setUserToDelete(null)} disabled={isDeletingUser} className="flex-1 py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">Cancel</button>
                        <button onClick={confirmDelete} disabled={isDeletingUser} className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 hover:shadow-red-600/20 shadow-sm transition-all flex justify-center items-center gap-2">
                            {isDeletingUser && <Loader2 size={16} className="animate-spin"/>} Delete
                        </button>
                    </div>
                 </div>
            </div>
        </div>
      )}

      {/* Main Modal Container */}
      <div className="bg-white border border-gray-100 shadow-2xl rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-3 tracking-tight">
            <Users className="text-blue-600" size={24}/> User Management
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-xl transition-colors">
            <X size={20} strokeWidth={2}/>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-2 border-b border-gray-100 gap-6">
          <button onClick={() => setActiveTab('list')} className={`pb-3 text-sm font-bold transition-all duration-200 border-b-2 ${activeTab==='list' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>User Directory</button>
          <button onClick={() => setActiveTab('create')} className={`pb-3 text-sm font-bold transition-all duration-200 border-b-2 ${activeTab==='create' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Register New User</button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-50/30 custom-scrollbar">
          {activeTab === 'list' ? (
            loading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Loader2 className="animate-spin mb-2" size={32}/> 
                    <p className="text-sm font-medium">Loading users...</p>
                </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-white border-b border-gray-200 text-gray-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10">
                  <tr>
                      <th className="p-4 pl-6">Facility & Role</th>
                      <th className="p-4">Name & Contact</th>
                      <th className="p-4">Email</th>
                      <th className="p-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-zinc-900 mb-1">{u.facility_name || <span className="italic text-gray-400 font-medium">System Admin</span>}</div>
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-zinc-900 text-white' : 'bg-blue-50 text-blue-700'}`}>
                            {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{u.full_name || <span className="italic text-gray-400 font-normal">No name set</span>}</div>
                        <div className="text-xs text-gray-500 mt-0.5 font-medium">{u.contact_number || '-'}</div>
                        <div className="text-xs text-gray-400 italic mt-0.5">{u.designation || '-'}</div>
                      </td>
                      <td className="p-4 font-medium text-gray-600">{u.email}</td>
                      <td className="p-4 pr-6 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingUserId(u.id)} className="text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Profile">
                                <Edit size={16} strokeWidth={2.5}/>
                            </button>
                            {u.role !== 'admin' && (
                                <button onClick={() => initiateDelete(u)} className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete User">
                                    <Trash2 size={16} strokeWidth={2.5}/>
                                </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            <div className="max-w-lg mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <RegisterUserForm facilities={availableFacilities} client={effectiveClient} onSuccess={() => { setActiveTab('list'); fetchUsers(); }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}