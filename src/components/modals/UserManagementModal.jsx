import React, { useState, useEffect } from 'react';
import { Users, X, Loader2, Edit, Trash2 } from 'lucide-react';
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

  // Use passed client or fallback to imported supabase
  const effectiveClient = client || supabase;

  const fetchUsers = async () => {
    setLoading(true);
    // Use effectiveClient just to be consistent, though strict Supabase import works fine for queries
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

  // Filter out facilities that are already assigned to a user
  // This ensures a facility only appears in the dropdown if it doesn't have a user yet
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
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {editingUserId && <ProfileModal userId={editingUserId} onClose={() => { setEditingUserId(null); fetchUsers(); }} />}
      
      {userToDelete && (
        <div className="fixed inset-0 bg-black/20 z-[60] flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
                 <div className="flex flex-col items-center text-center">
                    <div className="bg-red-50 p-3 rounded-full mb-4 text-red-600"><Trash2 size={24} /></div>
                    <h3 className="text-lg font-bold text-gray-900">Delete User?</h3>
                    <p className="text-sm text-gray-500 mt-2 mb-6">
                        Are you sure you want to delete <span className="font-semibold">{userToDelete.full_name || userToDelete.email}</span>? This action cannot be undone.
                    </p>
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setUserToDelete(null)} disabled={isDeletingUser} className="flex-1 py-2 px-4 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
                        <button onClick={confirmDelete} disabled={isDeletingUser} className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition flex justify-center items-center gap-2">
                            {isDeletingUser && <Loader2 size={14} className="animate-spin"/>} Delete
                        </button>
                    </div>
                 </div>
            </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 shadow-xl rounded-xl w-full max-w-4xl h-[85vh] flex flex-col animate-in fade-in zoom-in">
        <div className="flex justify-between items-center p-6 border-b border-gray-50">
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2"><Users size={20}/> User Management</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-zinc-900 transition"><X size={20}/></button>
        </div>

        <div className="flex px-6 border-b border-gray-50">
          <button onClick={() => setActiveTab('list')} className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab==='list' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-gray-500 hover:text-zinc-700'}`}>User List</button>
          <button onClick={() => setActiveTab('create')} className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab==='create' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-gray-500 hover:text-zinc-700'}`}>Create New User</button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'list' ? (
            loading ? <div className="text-center p-10"><Loader2 className="animate-spin inline mr-2" size={16}/> Loading...</div> : (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                  <tr><th className="p-3 rounded-l-lg">Facility / Role</th><th className="p-3">Name & Contact</th><th className="p-3">Email</th><th className="p-3 rounded-r-lg text-right"></th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3">
                        <div className="font-medium text-zinc-900">{u.facility_name}</div>
                        <div className={`text-[10px] uppercase font-bold tracking-wide mt-0.5 ${u.role === 'admin' ? 'text-zinc-900' : 'text-gray-400'}`}>{u.role}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-gray-900">{u.full_name || '-'}</div>
                        <div className="text-xs text-gray-500">{u.contact_number}</div>
                        <div className="text-xs text-gray-400 italic">{u.designation}</div>
                      </td>
                      <td className="p-3 text-gray-600">{u.email}</td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button onClick={() => setEditingUserId(u.id)} className="text-zinc-600 hover:text-zinc-900 p-1.5 hover:bg-gray-100 rounded mr-1 transition"><Edit size={16}/></button>
                        {u.role !== 'admin' && <button onClick={() => initiateDelete(u)} className="text-gray-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded transition"><Trash2 size={16}/></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            <div className="max-w-lg mx-auto mt-4">
              {/* Pass effectiveClient to ensure it never receives undefined */}
              {/* Pass availableFacilities to filter out taken ones */}
              <RegisterUserForm facilities={availableFacilities} client={effectiveClient} onSuccess={() => { setActiveTab('list'); fetchUsers(); }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}