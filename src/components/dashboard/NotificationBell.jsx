import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Clock } from 'lucide-react'; 
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function NotificationBell({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const isAnyAdmin = user?.role === 'admin' || user?.role === 'SYSADMIN';
  const recipient = isAnyAdmin ? 'PHO Admin' : user?.name;

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient', recipient)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount(data ? data.filter(n => !n.read).length : 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (!recipient) return;
    
    fetchNotifications();

    let isMounted = true;
    let channel = null;

    const connectionTimer = setTimeout(() => {
      if (!isMounted) return;

      const safeChannelId = `notif-${recipient.replace(/[^a-zA-Z0-9]/g, '')}`;

      channel = supabase
        .channel(safeChannelId)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `recipient=eq.${recipient}` 
        }, (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          setUnreadCount((prev) => prev + 1);
          toast.info("New Notification", {
            description: "Check your bell icon for a new update."
          });
        })
        .subscribe(); // Removed the console.log here!
    }, 500); 

    return () => {
      isMounted = false;
      clearTimeout(connectionTimer); 
      if (channel) {
        supabase.removeChannel(channel); 
      }
    };
  }, [recipient]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    
    setUnreadCount(0); 
    setNotifications(prev => prev.map(n => ({ ...n, read: true }))); 
    
    try {
      await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
    } catch (err) {
      fetchNotifications(); 
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => {
          if (!isOpen) markAllAsRead();
          setIsOpen(!isOpen);
        }} 
        className="relative p-2 text-slate-500 hover:text-amber-600 hover:-translate-y-0.5 transition-all duration-300 active:scale-90 outline-none"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-2.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[7px] font-black px-1 py-0.5 rounded-full shadow-sm border border-white animate-bounce whitespace-nowrap">
            {unreadCount} NEW!
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed top-16 left-4 right-4 z-50 sm:absolute sm:top-full sm:right-0 sm:left-auto sm:w-[380px] sm:mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          
          <div className="bg-slate-900 p-4 sm:p-5 border-b border-slate-800 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 p-2 rounded-lg text-yellow-400 shadow-inner border border-slate-700">
                <Bell size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-medium tracking-tight text-white leading-none">Notifications</h2>
                <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest leading-none">
                  {unreadCount === 0 ? 'ALL CAUGHT UP' : `YOU HAVE ${unreadCount} UNREAD ALERTS`}
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-all">
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto bg-slate-50 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center">
                 <Bell size={32} className="text-slate-300 mb-3" />
                 <p className="text-slate-500 text-sm font-bold">No notifications yet</p>
                 <p className="text-slate-400 text-xs mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-4 hover:bg-slate-100 transition-colors flex gap-4 ${!n.read ? 'bg-blue-50/40' : 'bg-white'}`}>
                    <div className="flex-1">
                      <p className={`text-[13px] leading-relaxed ${!n.read ? 'text-slate-900 font-bold' : 'text-slate-600 font-medium'}`}>
                        {n.message || n.content}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock size={10} />
                        {new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}