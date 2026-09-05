import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { Bell, CheckCheck, Clock, Sparkles, CheckCircle2, MessageSquare, Wallet } from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const { currentUser, notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!currentUser) return null;

  const myNotifs = notifications.filter((n) => n.userId === currentUser.id);
  const filteredNotifs = myNotifs.filter((n) => (filter === 'unread' ? !n.read : true));
  const unreadCount = myNotifs.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'project_update':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'application_status':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'payment':
        return <Wallet className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notifications & Announcements</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Stay informed on application reviews, admin project directives, and payments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5 text-slate-500" />
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`pb-2.5 transition-colors border-b-2 ${
            filter === 'all'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Notifications ({myNotifs.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`pb-2.5 transition-colors border-b-2 ${
            filter === 'unread'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No notifications found</p>
          <p className="text-xs text-slate-400 mt-1">You are completely caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifs.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationRead(notif.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                notif.read
                  ? 'bg-white border-slate-200 text-slate-600'
                  : 'bg-indigo-50/40 border-indigo-200 text-slate-900 shadow-2xs'
              }`}
            >
              <div className="p-2 rounded-lg bg-white border border-slate-100 shadow-2xs shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{notif.title}</h4>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {notif.date}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
              </div>
              {!notif.read && (
                <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-2" title="Unread" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
