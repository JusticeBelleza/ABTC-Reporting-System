import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

// Added 'export default' here:
export default function NotificationBell({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const wrapperRef = useRef(null);
  const recipientName = user.role === 'admin' ? 'PHO Admin' : user.name;

  const fetchNotifications = async () => {
    try {
      const dateOffset = (24*60*60*1000) * 30; 
      const myDate = new Date(); myDate.setTime(myDate.getTime() - dateOffset);
      await supabase.from('notifications').delete().lt('created_at', myDate.toISOString());
    } catch(e) {}
    const { data } = await supabase.from('notifications').select('*').eq('recipient', recipientName).order('created_at', { ascending: false });
    if (data) setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();
    const sub = supabase.channel('db-notifications').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient=eq.${recipientName}` }, (payload) => {
         setNotifications(prev => [payload.new, ...prev]);
         toast(payload.new.title, { description: payload.new.message });
      }).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [recipientName]);

  const markAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    setNotifications(prev => prev.map(n => ({...n, is_read: true})));
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
  };

  useEffect(() => {
    function handleClickOutside(event) { if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false); }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <button onClick={() => { if(!isOpen) markAsRead(); setIsOpen(!isOpen); }} className="relative p-2 text-gray-500 hover:text-zinc-900 transition-colors">
        <Bell size={20} strokeWidth={1.5} />
        {notifications.filter(n => !n.is_read).length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>}
      </button>
      {isOpen && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[90vw] max-w-sm md:absolute md:top-full md:left-auto md:right-0 md:translate-x-0 md:w-80 md:mt-2 bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-white"><h3 className="font-medium text-sm text-zinc-900">Notifications</h3></div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? <div className="p-8 text-center text-gray-400 text-xs">No notifications</div> : notifications.map((n) => (
              <div key={n.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/30' : ''}`}>
                <div className="flex justify-between items-start mb-1"><div className="font-medium text-sm text-zinc-900">{n.title}</div><div className="text-[10px] text-gray-400 ml-2">{new Date(n.created_at).toLocaleDateString()}</div></div>
                <div className="text-gray-500 text-xs leading-relaxed">{n.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}