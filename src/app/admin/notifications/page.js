"use client";
import { useState, useEffect, useCallback } from 'react';
import { 
  Bell, Send, Globe, Users, UserCheck, AlertTriangle, 
  CheckCircle2, Info, AlertCircle, Trash2, Search, 
  RefreshCw, X, Eye, Clock, Mail, Plus
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState('compose'); // 'compose' | 'history'

  // Form State
  const [targetType, setTargetType] = useState('all'); // 'all' | 'sellers' | 'specific'
  const [notificationType, setNotificationType] = useState('info'); // 'info' | 'success' | 'warning' | 'error'
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]); // [{ id, email }]

  // Email Input State for Specific Target
  const [emailInput, setEmailInput] = useState('');
  const [isAddingEmail, setIsAddingEmail] = useState(false);

  // Sending & History State
  const [isSending, setIsSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, globalCount: 0, targetedCount: 0 });

  // Fetch Sent History
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/admin/notifications?limit=60');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load notification history');
      setHistory(data.notifications || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error('Fetch history error:', err);
      toast.error(err.message || 'Failed to load notifications history');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Add recipient by email alone
  const handleAddEmail = async () => {
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) {
      return toast.error('Please enter an email address.');
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return toast.error('Please enter a valid email address.');
    }

    if (selectedUsers.some(u => u.email?.toLowerCase() === cleanEmail)) {
      return toast.error(`Email ${cleanEmail} has already been added.`);
    }

    setIsAddingEmail(true);
    try {
      const res = await fetch(`/api/admin/notifications/users?email=${encodeURIComponent(cleanEmail)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `No registered account found with email "${cleanEmail}".`);
      }

      setSelectedUsers(prev => [...prev, { id: data.user.id, email: data.user.email }]);
      setEmailInput('');
      toast.success(`Recipient ${data.user.email} added!`);
    } catch (err) {
      toast.error(err.message || 'Failed to verify email');
    } finally {
      setIsAddingEmail(false);
    }
  };

  const handleRemoveUser = (identifier) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== identifier && u.email !== identifier));
  };

  // Quick Preset Handlers
  const applyPreset = (presetTitle, presetMsg, presetType) => {
    setTitle(presetTitle);
    setMessage(presetMsg);
    setNotificationType(presetType);
  };

  // Submit Handler
  const handleSendNotification = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      return toast.error('Please enter a notification title.');
    }
    if (!message.trim()) {
      return toast.error('Please enter a notification message.');
    }
    if (targetType === 'specific' && selectedUsers.length === 0) {
      return toast.error('Please add at least one recipient user email.');
    }

    setIsSending(true);

    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          type: notificationType,
          targetType,
          targetUserIds: targetType === 'specific' ? selectedUsers.map(u => u.id).filter(Boolean) : [],
          targetEmails: targetType === 'specific' ? selectedUsers.map(u => u.email).filter(Boolean) : []
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch notification');

      toast.success(data.message || 'Notification sent successfully!');
      
      // Reset form
      setTitle('');
      setMessage('');
      setSelectedUsers([]);
      setEmailInput('');

      // Refresh history & switch tab
      fetchHistory();
      setActiveTab('history');
    } catch (err) {
      console.error('Send error:', err);
      toast.error(err.message || 'Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  // Delete notification handler
  const handleDeleteNotification = async (id) => {
    if (!confirm('Are you sure you want to delete this notification record?')) return;

    try {
      const res = await fetch(`/api/admin/notifications?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete notification');

      toast.success('Notification removed.');
      setHistory(prev => prev.filter(n => n.id !== id));
      setStats(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1)
      }));
    } catch (err) {
      toast.error(err.message || 'Failed to remove notification');
    }
  };

  // Filtered History
  const filteredHistory = history.filter(item => {
    const matchesSearch = 
      item.title?.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.message?.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.recipientName?.toLowerCase().includes(historySearch.toLowerCase());

    if (!matchesSearch) return false;

    if (historyFilter === 'global') return item.isGlobal;
    if (historyFilter === 'targeted') return !item.isGlobal;
    return true;
  });

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider mb-2 border border-indigo-100">
            <Bell className="w-3.5 h-3.5" />
            Global & User Communications
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
            Notification Center
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Broadcast platform-wide updates or dispatch targeted alerts directly to individual users and sellers.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-200 p-1 rounded-2xl border border-slate-300/60 font-black text-xs shrink-0">
          <button
            onClick={() => setActiveTab('compose')}
            className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'compose'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-indigo-600" />
            <span>Compose Alert</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sent History ({stats.total})</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Sent</p>
            <p className="text-2xl font-black text-slate-900">{stats.total.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Global Broadcasts</p>
            <p className="text-2xl font-black text-slate-900">{stats.globalCount.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Targeted Alerts</p>
            <p className="text-2xl font-black text-slate-900">{stats.targetedCount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: COMPOSE NOTIFICATION                                    */}
      {/* ============================================================== */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-200 p-6 sm:p-8 shadow-sm space-y-7">
            
            {/* Quick Presets */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                Quick Template Presets
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset(
                    'System Upgrade Complete',
                    'We have upgraded our AI generation engine with faster processing and improved formatting compliance.',
                    'success'
                  )}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  ⚡ Upgrade Complete
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(
                    'Scheduled Maintenance Notice',
                    'W3 WriteLab will undergo a brief system optimization on Sunday from 2:00 AM to 3:00 AM. Generator access will remain active.',
                    'warning'
                  )}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  🛠️ Maintenance
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(
                    'Campus Student Lead Program',
                    'Provide your school project templates and earn a 10% royalty on every project! Contact us on WhatsApp (08031797655) to register.',
                    'info'
                  )}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  🎓 Student Leads
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(
                    'Important Security & Account Notice',
                    'Please review your profile settings and ensure your password is secure. Never share your credentials.',
                    'error'
                  )}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  🚨 Security Alert
                </button>
              </div>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-6">
              
              {/* Target Audience Picker */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 block mb-3">
                  1. Target Audience
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Option A: All Users */}
                  <button
                    type="button"
                    onClick={() => { setTargetType('all'); setSelectedUsers([]); setEmailInput(''); }}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      targetType === 'all'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Globe className={`w-4 h-4 ${targetType === 'all' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="font-black text-xs text-slate-900">All Users</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">Global broadcast to all active accounts</p>
                  </button>

                  {/* Option B: Verified Sellers */}
                  <button
                    type="button"
                    onClick={() => { setTargetType('sellers'); setSelectedUsers([]); setEmailInput(''); }}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      targetType === 'sellers'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <UserCheck className={`w-4 h-4 ${targetType === 'sellers' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="font-black text-xs text-slate-900">All Sellers</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">Marketplace blueprint & ebook sellers</p>
                  </button>

                  {/* Option C: Specific Users (By Email Alone) */}
                  <button
                    type="button"
                    onClick={() => setTargetType('specific')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      targetType === 'specific'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Mail className={`w-4 h-4 ${targetType === 'specific' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="font-black text-xs text-slate-900">Specific Users</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">Add recipient users by email alone</p>
                  </button>
                </div>
              </div>

              {/* Specific Users Email Input & Add Button */}
              {targetType === 'specific' && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in duration-200">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1.5">
                      Add User by Email Alone
                    </label>
                    
                    <div className="flex gap-2.5">
                      <div className="relative flex-1">
                        <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                        <input
                          type="email"
                          placeholder="Enter user email (e.g. user@gmail.com)..."
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddEmail();
                            }
                          }}
                          disabled={isAddingEmail}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleAddEmail}
                        disabled={isAddingEmail || !emailInput.trim()}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                      >
                        {isAddingEmail ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Adding...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Selected Recipients Chips */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Selected Recipients ({selectedUsers.length})
                      </label>
                      {selectedUsers.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedUsers([])}
                          className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {selectedUsers.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-white text-center">
                        <p className="text-xs text-slate-400 font-medium">
                          No recipients added yet. Enter an email above and click &quot;Add&quot;.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                        {selectedUsers.map((u) => (
                          <span
                            key={u.id || u.email}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs font-bold shadow-sm"
                          >
                            <Mail className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>{u.email}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveUser(u.id || u.email)}
                              className="text-slate-400 hover:text-red-600 transition-colors ml-0.5"
                              title="Remove"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notification Type */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 block mb-3">
                  2. Alert Level & Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'info', label: 'Information', icon: Info, color: 'text-indigo-600', border: 'border-indigo-600 bg-indigo-50/50' },
                    { id: 'success', label: 'Success', icon: CheckCircle2, color: 'text-emerald-600', border: 'border-emerald-600 bg-emerald-50/50' },
                    { id: 'warning', label: 'Warning', icon: AlertTriangle, color: 'text-amber-600', border: 'border-amber-600 bg-amber-50/50' },
                    { id: 'error', label: 'Urgent Alert', icon: AlertCircle, color: 'text-red-600', border: 'border-red-600 bg-red-50/50' }
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = notificationType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setNotificationType(t.id)}
                        className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                          isSelected
                            ? `${t.border} shadow-sm font-black`
                            : 'border-slate-200 bg-white hover:border-slate-300 font-bold text-slate-700'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${t.color}`} />
                        <span className="text-xs">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & Message */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                      3. Notification Title
                    </label>
                    <span className="text-[10px] text-slate-400 font-bold">{title.length}/100</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="e.g. Scheduled Service Maintenance or New Feature Release"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-600 transition-all"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                      4. Message Details
                    </label>
                    <span className="text-[10px] text-slate-400 font-bold">{message.length}/500</span>
                  </div>
                  <textarea
                    required
                    maxLength={500}
                    rows={4}
                    placeholder="Enter the complete message that will be shown in the user's notification feed..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-600 transition-all leading-relaxed resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-xs text-slate-400 font-medium">
                  {targetType === 'all' 
                    ? 'Broadcasting to all platform users' 
                    : targetType === 'sellers' 
                    ? 'Dispatching to verified sellers' 
                    : `Sending to ${selectedUsers.length} email recipient(s)`}
                </span>

                <button
                  type="submit"
                  disabled={isSending}
                  className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Broadcasting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Notification</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Right Sidebar: Live Preview (1 col) */}
          <div className="space-y-6">
            <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                <Eye className="w-4 h-4 text-indigo-600" />
                <span>Live Feed Preview</span>
              </div>

              <p className="text-xs text-slate-500 font-medium mb-4">
                This is exactly how this notification will look in the user&apos;s bell dropdown:
              </p>

              {/* Dropdown Card Mockup */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 shadow-inner space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-[10px] font-black uppercase text-slate-700">Notifications</span>
                  <span className="text-[9px] font-bold text-indigo-600">New Alert</span>
                </div>

                <div className="flex gap-3 pt-1">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                    notificationType === 'success' ? 'bg-emerald-500' :
                    notificationType === 'error' ? 'bg-red-500' :
                    notificationType === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <p className="text-xs font-black text-slate-900 leading-tight">
                        {title.trim() || 'Notification Title'}
                      </p>
                      {targetType === 'all' && (
                        <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                          Global
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      {message.trim() || 'Your notification message description will appear here...'}
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-2">Just Now</p>
                  </div>
                </div>
              </div>

              {/* Toast Mockup */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Real-time Toast Popup
                </p>
                <div className="p-3.5 rounded-xl bg-slate-900 text-white shadow-xl flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    notificationType === 'success' ? 'bg-emerald-400' :
                    notificationType === 'error' ? 'bg-red-400' :
                    notificationType === 'warning' ? 'bg-amber-400' : 'bg-indigo-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white">{title.trim() || 'New Update'}</p>
                    <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">
                      {message.trim() || 'Notification details preview...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Help / Guidance Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-6 border border-indigo-100 text-xs text-indigo-900 space-y-2">
              <span className="font-black uppercase tracking-wider text-[10px] text-indigo-600 block">
                Broadcasting Guidelines
              </span>
              <p className="leading-relaxed font-medium">
                • <strong>Global Broadcast:</strong> Stored efficiently and instantaneously delivered to all student accounts in real-time.
              </p>
              <p className="leading-relaxed font-medium">
                • <strong>All Sellers:</strong> Targeted updates about marketplace policy, payout schedules, or uploads.
              </p>
              <p className="leading-relaxed font-medium">
                • <strong>Specific Users:</strong> Add individual accounts by email alone using the &quot;Add&quot; button to send personalized alerts.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: SENT NOTIFICATIONS HISTORY                              */}
      {/* ============================================================== */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm space-y-4 p-6 sm:p-8">
          
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search history by title, text, or recipient..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-600 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setHistoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  historyFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({history.length})
              </button>
              <button
                onClick={() => setHistoryFilter('global')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  historyFilter === 'global' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Global ({stats.globalCount})
              </button>
              <button
                onClick={() => setHistoryFilter('targeted')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  historyFilter === 'targeted' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Targeted ({stats.targetedCount})
              </button>
              <button
                onClick={fetchHistory}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors ml-2"
                title="Refresh History"
              >
                <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* History List */}
          {loadingHistory ? (
            <div className="p-16 text-center text-slate-400 font-bold text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
              Loading notification records...
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-16 text-center">
              <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-black uppercase text-slate-700">No Notifications Found</p>
              <p className="text-xs text-slate-400 mt-1">Try a different search query or compose a new broadcast.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredHistory.map((item) => (
                <div key={item.id} className="py-4 hover:bg-slate-50/60 p-4 rounded-2xl transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                      item.type === 'success' ? 'bg-emerald-500' :
                      item.type === 'error' ? 'bg-red-500' :
                      item.type === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-black text-sm text-slate-900 tracking-tight">{item.title}</h4>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          item.isGlobal 
                            ? 'bg-amber-100 text-amber-900' 
                            : 'bg-purple-100 text-purple-900'
                        }`}>
                          {item.recipientName}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed break-words">{item.message}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        Sent on {new Date(item.created_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteNotification(item.id)}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
