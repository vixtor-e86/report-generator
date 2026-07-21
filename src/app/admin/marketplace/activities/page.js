"use client";
import { useState, useEffect, useCallback } from 'react';
import { 
  Activity, Search, ArrowDownCircle, ShoppingBag, 
  CheckCircle, Clock, AlertCircle, RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';

export default function MarketplaceActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'purchase', 'deposit'

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/marketplace/activities');
      const data = await response.json();
      if (response.ok && data.activities) {
        setActivities(data.activities);
      } else {
        toast.error(data.error || 'Failed to fetch activities');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error. Failed to load activities.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Filters
  const filteredActivities = activities.filter(act => {
    const matchesSearch = 
      act.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.reference.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || act.type === filterType;

    return matchesSearch && matchesType;
  });

  // Math for stats
  const totalVolume = activities.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const purchaseCount = activities.filter(a => a.type === 'purchase').length;
  const depositCount = activities.filter(a => a.type === 'deposit' && a.status === 'completed').length;
  const pendingDeposits = activities.filter(a => a.type === 'deposit' && a.status === 'pending').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight flex items-center gap-3">
            <Activity className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
            Marketplace Activities
          </h1>
          <p className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-wider mt-1">
            Real-time audit log of tool consumption, blueprint & ebook orders, and wallet deposits
          </p>
        </div>
        <button 
          onClick={fetchActivities} 
          className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2 rounded-2xl flex items-center gap-2 font-bold uppercase text-xs transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Logs
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><ShoppingBag className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Purchases</p>
            <p className="text-lg md:text-2xl font-black text-slate-950">{purchaseCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><CheckCircle className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Deposits Completed</p>
            <p className="text-lg md:text-2xl font-black text-slate-950">{depositCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><Clock className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pending Deposits</p>
            <p className="text-lg md:text-2xl font-black text-slate-950">{pendingDeposits}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-xl"><ArrowDownCircle className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Volume</p>
            <p className="text-lg md:text-2xl font-black text-slate-950">₦{totalVolume.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        
        {/* Controls: Search & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          
          {/* Tab Filters */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl self-start gap-1">
            <button 
              onClick={() => setFilterType('all')} 
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${filterType === 'all' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              All Logs
            </button>
            <button 
              onClick={() => setFilterType('purchase')} 
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${filterType === 'purchase' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Purchases / Tools
            </button>
            <button 
              onClick={() => setFilterType('deposit')} 
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${filterType === 'deposit' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Funding
            </button>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 border border-slate-200 rounded-2xl px-4 py-3 bg-slate-50/50 flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search user, description, reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-sm font-medium"
            />
          </div>
        </div>

        {/* Activity Table */}
        {loading ? (
          <div className="py-24 flex flex-col justify-center items-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-xs font-black uppercase tracking-wider">Loading marketplace transaction logs...</span>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-24 text-center text-slate-400 space-y-2">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold uppercase">No transactions matched your filters.</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Customer Details</th>
                    <th className="p-4">Transaction Type</th>
                    <th className="p-4">Description</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredActivities.map(act => (
                    <tr key={act.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 whitespace-nowrap text-slate-400 font-medium">
                        {new Date(act.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{act.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{act.email}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          act.type === 'purchase' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {act.type === 'purchase' ? 'purchase / use' : 'funding'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 max-w-sm truncate">{act.description}</div>
                        <div className="text-[10px] text-slate-400 font-medium font-mono uppercase">Ref: {act.reference}</div>
                      </td>
                      <td className="p-4 text-right font-black text-slate-950">
                        {act.amount > 0 ? `₦${act.amount.toLocaleString()}` : 'Free'}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ${
                          act.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' :
                          act.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                          'bg-red-500/10 text-red-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            act.status === 'completed' ? 'bg-emerald-500' :
                            act.status === 'pending' ? 'bg-amber-500' :
                            'bg-red-500'
                          }`} />
                          {act.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
