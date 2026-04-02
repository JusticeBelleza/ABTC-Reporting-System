import React, { useState, useEffect } from 'react';
import { Users, X, Loader2, Edit, Trash2, Building2, Mail, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import RegisterUserForm from '../auth/RegisterUserForm'; 
import ProfileModal from './ProfileModal';
import ModalPortal from './ModalPortal';
import { useApp } from '../../context/AppContext';

export default function UserManagementModal({ onClose, facilities, client }) {
  const { user: currentUser } = useApp();
  
  const [activeTab, setActiveTab] = useState('list'); 
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

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

  // Pagination Logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage) || 1;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'SYSADMIN') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (role === 'admin') return 'bg-slate-800 text-white border-slate-700';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
      
      {/* Edit Profile Sub-Modal */}
      {editingUserId && <ProfileModal userId={editingUserId} onClose={() => { setEditingUserId(null); fetchUsers(); }} />}
      
      {/* Delete Confirmation Sub-Modal */}
      {userToDelete && (
        <ModalPortal>
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-in fade-in duration-200">
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

      {/* Main Modal Container (Matches Audit Logs Style) */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden relative border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Dark Header - Compact Version */}
        <div className="bg-slate-900 p-4 sm:p-5 border-b border-slate-800 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 p-2 rounded-lg text-yellow-400 shadow-inner border border-slate-700">
              <Users size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white leading-none">User Management</h2>
              <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest leading-none">
                MANAGE PROVINCIAL AND FACILITY ACCESS
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 active:scale-90 active:bg-slate-600 rounded-full transition-all duration-200"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-3 border-b border-slate-200 bg-white shrink-0 gap-6">
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
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 flex flex-col relative custom-scrollbar">
          {activeTab === 'list' ? (
            loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <Loader2 size={32} className="animate-spin mb-3 text-blue-500" />
                    <p className="text-xs font-semibold">Loading user directory...</p>
                </div>
            ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed mx-2 sm:mx-0">
                    <Users size={48} className="mb-4 opacity-20" />
                    <p className="text-xs font-semibold text-slate-500">No users found.</p>
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 shadow-sm bg-white w-full overflow-hidden flex flex-col flex-1">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse text-[10px] sm:text-[11px] min-w-[800px]">
                            <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="py-2.5 px-3 sm:px-4 border-r border-slate-200 w-[25%]">Assigned Facility</th>
                                    <th className="py-2.5 px-3 sm:px-4 border-r border-slate-200 text-center w-28">Role</th>
                                    <th className="py-2.5 px-3 sm:px-4 border-r border-slate-200 w-[25%]">Full Name & Designation</th>
                                    <th className="py-2.5 px-3 sm:px-4 border-r border-slate-200 w-[25%]">Contact Info</th>
                                    <th className="py-2.5 px-3 sm:px-4 text-center w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentUsers.map((u) => (
                                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0">
                                        <td className="py-2.5 px-3 sm:px-4 font-bold text-slate-800 border-r border-slate-100 align-middle">
                                            {u.facility_name || <span className="italic text-slate-400 font-medium">System Administration</span>}
                                        </td>
                                        <td className="py-2.5 px-3 sm:px-4 border-r border-slate-100 text-center align-middle">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-widest ${getRoleBadge(u.role)}`}>
                                                {u.role === 'user' ? 'Encoder' : u.role}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 sm:px-4 border-r border-slate-100 align-middle">
                                            <div className="font-bold text-slate-700">{u.full_name || <span className="italic text-slate-400 font-normal">Not Set</span>}</div>
                                            <div className="text-[9px] text-slate-500 mt-0.5">{u.designation || 'No Designation'}</div>
                                        </td>
                                        <td className="py-2.5 px-3 sm:px-4 border-r border-slate-100 align-middle font-medium text-slate-600">
                                            <div>{u.email}</div>
                                            <div className="text-[9px] text-slate-400 mt-0.5">{u.contact_number || '-'}</div>
                                        </td>
                                        <td className="py-2.5 px-3 sm:px-4 text-center align-middle">
                                            <div className="flex justify-center gap-1.5">
                                                <button 
                                                    onClick={() => setEditingUserId(u.id)} 
                                                    className="p-1.5 bg-white border border-slate-200 text-slate-500 rounded hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm active:scale-95"
                                                    title="Edit User"
                                                >
                                                    <Edit size={14} strokeWidth={2.5}/>
                                                </button>
                                                {currentUser?.role === 'SYSADMIN' && u.id !== currentUser?.id && (
                                                    <button 
                                                        onClick={() => initiateDelete(u)} 
                                                        className="p-1.5 bg-white border border-red-100 text-red-500 rounded hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all shadow-sm active:scale-95"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={14} strokeWidth={2.5}/>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )
          ) : (
            <div className="w-full max-w-2xl mx-auto py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
                  <div className="mb-6 text-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Users className="text-slate-600" size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">Register New User</h3>
                      <p className="text-xs text-slate-500 mt-1">Create a new account and assign appropriate permissions.</p>
                  </div>
                  <RegisterUserForm facilities={availableFacilities} client={effectiveClient} onSuccess={() => { setActiveTab('list'); fetchUsers(); }} />
              </div>
            </div>
          )}
        </div>

        {/* Pagination Footer (Only visible on User Directory tab) */}
        {!loading && activeTab === 'list' && users.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 sm:px-8 py-3 border-t border-slate-200 bg-white shrink-0 gap-4">
            
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-medium text-slate-500">
              <span>Show</span>
              <select 
                value={usersPerPage} 
                onChange={(e) => { setUsersPerPage(Number(e.target.value)); setCurrentPage(1); }} 
                className="bg-slate-50 border border-slate-200 rounded p-1 outline-none focus:ring-2 focus:ring-slate-900/20 font-bold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>users per page</span>
            </div>

            <div className="flex items-center gap-4 text-[10px] sm:text-xs font-medium text-slate-500">
              <span>Page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong></span>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronLeft size={14} strokeWidth={2.5} />
                </button>
                <button 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronRight size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            
          </div>
        )}

      </div>
    </div>
  );
}