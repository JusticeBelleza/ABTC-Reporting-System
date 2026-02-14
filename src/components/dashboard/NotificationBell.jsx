import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Create the channel
    const channel = supabase
      .channel('public:notifications') 
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    // 2. Fetch initial data
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) {
        setNotifications(data);
        setUnreadCount(data.length); 
      }
    };

    fetchNotifications();

    // 3. CLEANUP FUNCTION
    // We explicitly catch errors here to suppress the "await in removeChannel" 
    // error that occurs during React Strict Mode's rapid unmounting.
    return () => {
      if (channel) {
        // We use a try-catch block around the promise chain as a safeguard
        try {
          supabase.removeChannel(channel).catch((err) => {
            // Intentionally empty: suppress "WebSocket is closed" errors 
            // caused by Strict Mode unmounting before connection is established.
          });
        } catch (e) {
          // Ignore synchronous errors if any
        }
      }
    };
  }, []);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={handleOpen} 
        className="relative p-2 text-gray-400 hover:text-white transition-colors focus:outline-none"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute right-0 w-80 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  No new notifications
                </div>
              ) : (
                notifications.map((n, i) => (
                  <div key={n.id || i} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <p className="text-sm text-gray-800">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}