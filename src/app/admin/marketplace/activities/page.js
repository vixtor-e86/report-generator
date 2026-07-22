"use client";
import { useState, useEffect, useCallback } from 'react';
import { 
  Activity, Search, ArrowDownCircle, ShoppingBag, 
  AlertCircle, RefreshCw, BookOpen, Cpu, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

export default function MarketplaceActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

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

  // Subcategory helper
  const getSubcategory = (description) => {
    const desc = description.toLowerCase();
    if (desc.includes('purchase:')) return 'items';
    if (desc.includes('humanizer')) return 'humanizer';
    if (desc.includes('slide') || desc.includes('slides')) return 'slides';
    if (desc.includes('deepsearch')) return 'deepsearch';
    return 'other-tools';
  };

  const getSubcategoryLabel = (description) => {
    const sub = getSubcategory(description);
    if (sub === 'items') return 'Ebook/Blueprint';
    if (sub === 'humanizer') return 'AI Humanizer';
    if (sub === 'slides') return 'Slide Generator';
    if (sub === 'deepsearch') return 'DeepSearch';
    if (description.toLowerCase().includes('explainer')) return 'Code Explainer';
    if (description.toLowerCase().includes('plagiarism')) return 'Plagiarism Checker';
    if (description.toLowerCase().includes('reference')) return 'Reference Finder';
    if (description.toLowerCase().includes('analysis')) return 'Data Analysis';
    if (description.toLowerCase().includes('visual')) return 'Visual Studio';
    return 'Other Tool';
  };

  const getBadgeStyle = (description) => {
    const sub = getSubcategory(description);
    if (sub === 'items') return 'bg-amber-50 text-amber-700 border border-amber-100';
    if (sub === 'humanizer') return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
    if (sub === 'slides') return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
    if (sub === 'deepsearch') return 'bg-violet-50 text-violet-700 border border-violet-100';
    return 'bg-blue-50 text-blue-700 border border-blue-100';
  };

  // Filter logic
  const filteredActivities = activities.filter(act => {
    const matchesSearch = 
      act.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.reference.toLowerCase().includes(searchTerm.toLowerCase());

    const sub = getSubcategory(act.description);
    const matchesCategory = categoryFilter === 'all' || sub === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Math for stats
  const totalVolume = activities.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalPurchases = activities.length;
  const toolConsumptions = activities.filter(a => getSubcategory(a.description) !== 'items').length;
  const blueprintEbookSales = activities.filter(a => getSubcategory(a.description) === 'items').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 sm:px-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Marketplace Activities</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time audit log of tool consumption, blueprint & ebook orders, and wallet purchases
          </p>
        </div>
        <button 
          onClick={fetchActivities} 
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition flex items-center gap-2"
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
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Sales count</p>
            <p className="text-lg md:text-2xl font-black text-slate-950">{totalPurchases}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><Cpu className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tool Consumptions</p>
            <p className="text-lg md:text-2xl font-black text-slate-950">{toolConsumptions}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><BookOpen className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Blueprints & Ebooks</p>
            <p className="text-lg md:text-2xl font-black text-slate-950">{blueprintEbookSales}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-xl"><ArrowDownCircle className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Revenue</p>
            <p className="text-lg md:text-2xl font-black text-slate-950">₦{totalVolume.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        
        {/* Controls: Search & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          
          {/* Tab Filters */}
          <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl gap-1">
            {[
              { id: 'all', label: 'All Logs', color: 'bg-slate-950 text-white' },
              { id: 'humanizer', label: 'AI Humanizer', color: 'bg-emerald-600 text-white' },
              { id: 'slides', label: 'Slide Generator', color: 'bg-indigo-600 text-white' },
              { id: 'deepsearch', label: 'DeepSearch', color: 'bg-violet-600 text-white' },
              { id: 'other-tools', label: 'Other Tools', color: 'bg-blue-600 text-white' },
              { id: 'items', label: 'Blueprints & Ebooks', color: 'bg-amber-600 text-white' }
            ].map(cat => (
              <button 
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)} 
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  categoryFilter === cat.id ? `${cat.color} shadow-sm` : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 border border-slate-200 rounded-2xl px-4 py-3 bg-slate-50/50 flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer, item, reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-sm font-medium"
            />
          </div>
        </div>

        {/* Activity Table */}
        {loading ? (
          <div className="py-24 flex flex-col justify-center items-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
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
                  <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Customer Details</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Description</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredActivities.map(act => (
                    <tr key={act.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 whitespace-nowrap text-slate-400 font-bold">
                        {new Date(act.createdAt).toLocaleString('en-GB', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </td>
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900">{act.username}</div>
                        <div className="text-[10px] text-slate-500 font-bold">{act.email}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ${getBadgeStyle(act.description)}`}>
                          {getSubcategoryLabel(act.description)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 max-w-sm truncate">{act.description}</div>
                        <div className="text-[10px] text-slate-400 font-bold font-mono">Ref: {act.reference}</div>
                      </td>
                      <td className="p-4 text-right font-black text-slate-950">
                        {act.amount > 0 ? `₦${act.amount.toLocaleString()}` : 'Free'}
                      </td>
                      <td className="p-4 text-right">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600">
                          <ShieldCheck className="w-3 h-3 text-emerald-500" />
                          COMPLETED
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
