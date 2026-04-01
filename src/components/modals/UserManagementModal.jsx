import React, { useState, useEffect } from 'react';
import { Users, X, Loader2, Edit, Trash2, Building2, Mail, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import RegisterUserForm from '../auth/RegisterUserForm'; 
import ProfileModal from './ProfileModal';
import ModalPortal from './ModalPortal';
import { useApp } from '../../context/AppContext'; // Import context for RBAC check

export default function UserManagementModal({ onClose, facilities, client }) {
  // Extract currentUser from Context to enforce RBAC
  const { user: currentUser } = useApp();
  
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
            if (a.role === 'SYSADMIN' && b.role !== 'SYSADMIN') return -1;
            if (a.role !== 'SYSADMIN' && b.role === 'SYSADMIN') return 1;
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
      toast.success("User deleted successfully.");
      fetchUsers();
    } catch(err) { toast.error("Error deleting user: " + err.message); }
    setIsDeletingUser(false);
    setUserToDelete(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      
      {/* Edit Profile Sub-Modal */}
      {editingUserId && <ProfileModal userId={editingUserId} onClose={() => { setEditingUserId(null); fetchUsers(); }} />}
      
      {/* Delete Confirmation Sub-Modal */}
      {userToDelete && (
        <ModalPortal>
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                 <div className="flex flex-col items-center text-center">
                    <div className="bg-red-50 p-4 rounded-full mb-5 text-red-600 shadow-inner">
                        <ShieldAlert size={32} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Delete User?</h3>
                    <p className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
                        Are you sure you want to delete <strong className="text-slate-900">{userToDelete.full_name || userToDelete.email}</strong>? This action removes their access completely and cannot be undone.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <button onClick={() => setUserToDelete(null)} disabled={isDeletingUser} className="flex-1 py-3 sm:py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all duration-200 order-2 sm:order-1">
                            Cancel
                        </button>
                        <button onClick={confirmDelete} disabled={isDeletingUser} className="flex-1 py-3 sm:py-2.5 px-4 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 hover:shadow-red-600/20 shadow-sm active:scale-95 transition-all flex justify-center items-center gap-2 order-1 sm:order-2">
                            {isDeletingUser && <Loader2 size={16} className="animate-spin"/>} Delete
                        </button>
                    </div>
                 </div>
            </div>
        </div>
      </ModalPortal>
      )}

      {/* Main Modal Container */}
      <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header - Deep Slate Design */}
        <div className="bg-slate-900 px-6 py-5 border-b border-slate-800 flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-slate-800 rounded-full opacity-50 blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-3 relative z-10">
              <div className="p-2 bg-slate-800/80 rounded-lg text-yellow-400 shadow-inner border border-slate-700">
                  <Users size={20} strokeWidth={2.5} />
              </div>
              <div>
                  <h2 className="text-lg font-bold text-white tracking-tight leading-tight">User Management</h2>
                  <p className="text-[10px] sm:text-xs font-medium text-slate-400 mt-0.5">Add, edit, or remove facility access</p>
              </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-all active:scale-90 border border-slate-700 shadow-sm relative z-10">
            <X size={18} strokeWidth={2.5}/>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-3 border-b border-slate-100 gap-6 bg-slate-50 shrink-0">
          <button 
              onClick={() => setActiveTab('list')} 
              className={`pb-3 text-sm font-bold transition-all duration-200 border-b-[3px] ${activeTab==='list' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'}`}
          >
              User Directory
          </button>
          <button 
              onClick={() => setActiveTab('create')} 
              className={`pb-3 text-sm font-bold transition-all duration-200 border-b-[3px] ${activeTab==='create' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'}`}
          >
              Register New User
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-white custom-scrollbar relative">
          {activeTab === 'list' ? (
            loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-white/80 backdrop-blur-sm z-10">
                    <Loader2 className="animate-spin mb-3 text-yellow-500" size={32} strokeWidth={2.5}/> 
                    <p className="text-xs font-bold text-slate-600 tracking-wide uppercase">Loading users...</p>
                </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-widest sticky top-0 z-10">
                  <tr>
                      <th className="p-3 sm:p-4 pl-6">Facility & Role</th>
                      <th className="p-3 sm:p-4 hidden sm:table-cell">Name & Contact</th>
                      <th className="p-3 sm:p-4 hidden md:table-cell">Email Address</th>
                      <th className="p-3 sm:p-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                      
                      <td className="p-3 sm:p-4 pl-6 align-top sm:align-middle">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-400 shrink-0 hidden sm:block">
                                <Building2 size={16} />
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 text-sm mb-1 group-hover:text-black transition-colors leading-tight">
                                    {u.facility_name || <span className="italic text-slate-400">System Admin</span>}
                                </div>
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shadow-sm border ${u.role === 'SYSADMIN' ? 'bg-purple-700 text-white border-purple-600' : u.role === 'admin' ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-700 border-slate-200'}`}>
                                    {u.role}
                                </span>

                                {/* Mobile Only Content */}
                                <div className="sm:hidden mt-2 space-y-1">
                                    <div className="font-semibold text-slate-800 text-xs">{u.full_name || <span className="italic text-slate-400 font-normal">No name set</span>}</div>
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5"><Mail size={10}/> {u.email}</div>
                                </div>
                            </div>
                        </div>
                      </td>

                      <td className="p-3 sm:p-4 hidden sm:table-cell align-middle">
                        <div className="font-bold text-slate-800 text-sm">{u.full_name || <span className="italic text-slate-400 font-normal text-xs">No name set</span>}</div>
                        <div className="text-[11px] text-slate-500 mt-1 font-medium bg-slate-100 inline-block px-1.5 py-0.5 rounded border border-slate-200">{u.designation || 'No Designation'}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{u.contact_number || '-'}</div>
                      </td>

                      <td className="p-3 sm:p-4 hidden md:table-cell align-middle font-medium text-slate-600 text-sm">
                          {u.email}
                      </td>

                      <td className="p-3 sm:p-4 pr-6 text-right whitespace-nowrap align-top sm:align-middle">
                        <div className="flex justify-end gap-1.5">
                            <button 
                                onClick={() => setEditingUserId(u.id)} 
                                className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 active:scale-90 transition-all shadow-sm" 
                                title="Edit User Profile"
                            >
                                <Edit size={16} strokeWidth={2.5}/>
                            </button>
                            
                            {/* RBAC: ONLY SYSADMIN CAN DELETE OTHER USERS */}
                            {currentUser?.role === 'SYSADMIN' && u.id !== currentUser?.id && (
                                <button 
                                    onClick={() => initiateDelete(u)} 
                                    className="p-2 bg-white border border-red-100 text-red-500 rounded-lg hover:bg-red-50 hover:text-red-700 hover:border-red-300 active:scale-90 transition-all shadow-sm" 
                                    title="Delete User"
                                >
                                    <Trash2 size={16} strokeWidth={2.5}/>
                                </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {users.length === 0 && !loading && (
                      <tr>
                          <td colSpan="4" className="p-12 text-center text-slate-500 text-sm">No users found.</td>
                      </tr>
                  )}
                </tbody>
              </table>
            )
          ) : (
            <div className="max-w-xl mx-auto py-8 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <RegisterUserForm facilities={availableFacilities} client={effectiveClient} onSuccess={() => { setActiveTab('list'); fetchUsers(); }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}