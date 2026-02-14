import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function NotificationBell({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Determine the recipient strictly.
  // Admin sees 'PHO Admin', Facilities see their specific Name.
  const recipient = user?.role === 'admin' ? 'PHO Admin' : user?.name;

  // 1. Fetch & Subscribe
  useEffect(() => {
    if (!recipient) return;
    
    fetchNotifications();

    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `recipient=eq.${recipient}` 
      }, (payload) => {
        setNotifications((prev) => [payload.new, ...prev]);
        setUnreadCount((prev) => prev + 1);
        toast.info("New Notification received");
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [recipient]);

  // 2. Click Outside Listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // 3. Fetch Notifications from DB
  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient', recipient) // STRICTLY filter by recipient
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      const unread = data ? data.filter(n => !n.read).length : 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // 4. Mark All Read Logic
  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    // 1. Optimistic Update (Clear UI immediately)
    const prevCount = unreadCount;
    setUnreadCount(0); 
    setNotifications(prev => prev.map(n => ({ ...n, read: true }))); 

    // 2. Update Supabase
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);

      if (error) {
        throw error; // Trigger catch block
      }
    } catch (err) {
      console.error("Supabase Update Failed:", err.message);
      toast.error(`Could not save 'Read' status: ${err.message}`);
      
      // Revert UI changes because save failed
      setUnreadCount(prevCount);
      fetchNotifications(); 
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
        setIsOpen(true);
        markAllAsRead(); 
    } else {
        setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle} 
        className="relative p-2 text-gray-600 hover:text-zinc-900 transition-colors rounded-full hover:bg-gray-100 outline-none focus:ring-2 focus:ring-zinc-200"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="fixed top-16 left-4 right-4 z-50 sm:absolute sm:top-full sm:right-0 sm:left-auto sm:w-96 sm:mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="flex items-center justify-between p-4 border-b border-gray-50 bg-gray-50/50">
            <h3 className="font-semibold text-zinc-900">Notifications</h3>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                <Bell className="mx-auto mb-3 opacity-20" size={32} />
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notification) => (
                  <div key={notification.id} className={`p-4 hover:bg-gray-50 transition-colors flex gap-3 ${!notification.read ? 'bg-blue-50/10' : ''}`}>
                    <div className="flex-1">
                      <p className={`text-sm ${!notification.read ? 'text-zinc-900 font-semibold' : 'text-gray-600'}`}>
                        {notification.message || notification.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleDateString()} • {new Date(notification.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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