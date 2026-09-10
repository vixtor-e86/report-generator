"use client";

import { useState, useEffect, useMemo } from 'react';

export default function MonthlyRevenueSection({ userRole, currentUserId }) {
  const [data, setData] = useState({ months: [], currentMonth: '', summary: null });
  const [loading, setLoading] = useState(true);
  const [selectedMonthKey, setSelectedMonthKey] = useState('');
  
  // Cost inputs for the selected month
  const [apiCostInput, setApiCostInput] = useState('');
  const [maintenanceCostInput, setMaintenanceCostInput] = useState('');
  const [miscCostInput, setMiscCostInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // { type: 'success' | 'error', message: '' }
  const [showHistoryTable, setShowHistoryTable] = useState(true);

  // Fetch monthly revenue data
  const fetchRevenueData = async (preferredMonth = null) => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/monthly-revenue');
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Failed to fetch revenue data');

      setData(json);

      const targetMonth = preferredMonth || selectedMonthKey || json.currentMonth || (json.months?.[0]?.month || '');
      setSelectedMonthKey(targetMonth);

      // Populate inputs from selected month
      const monthObj = json.months?.find(m => m.month === targetMonth);
      if (monthObj) {
        setApiCostInput(monthObj.apiCost > 0 ? String(monthObj.apiCost) : '');
        setMaintenanceCostInput(monthObj.maintenanceCost > 0 ? String(monthObj.maintenanceCost) : '');
        setMiscCostInput(monthObj.miscCost > 0 ? String(monthObj.miscCost) : '');
        setNotesInput(monthObj.notes || '');
      } else {
        setApiCostInput('');
        setMaintenanceCostInput('');
        setMiscCostInput('');
        setNotesInput('');
      }
    } catch (err) {
      console.error('Error loading revenue data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  // When selected month changes, update inputs
  const handleSelectMonth = (monthKey) => {
    setSelectedMonthKey(monthKey);
    setSaveStatus(null);
    const monthObj = data.months?.find(m => m.month === monthKey);
    if (monthObj) {
      setApiCostInput(monthObj.apiCost > 0 ? String(monthObj.apiCost) : '');
      setMaintenanceCostInput(monthObj.maintenanceCost > 0 ? String(monthObj.maintenanceCost) : '');
      setMiscCostInput(monthObj.miscCost > 0 ? String(monthObj.miscCost) : '');
      setNotesInput(monthObj.notes || '');
    } else {
      setApiCostInput('');
      setMaintenanceCostInput('');
      setMiscCostInput('');
      setNotesInput('');
    }
  };

  // Selected month object from fetched data
  const currentMonthData = useMemo(() => {
    return data.months?.find(m => m.month === selectedMonthKey) || {
      month: selectedMonthKey,
      monthLabel: selectedMonthKey,
      grossRevenue: 0,
      transactionCount: 0,
      apiCost: 0,
      maintenanceCost: 0,
      miscCost: 0,
      totalExpenses: 0,
      netIncome: 0,
      profitMargin: 0,
      hasExpensesRecorded: false,
      tiers: { standard: 0, premium: 0, unlock: 0, other: 0 },
      gateways: { squad: 0, flutterwave: 0, paystack: 0, manual: 0 }
    };
  }, [data.months, selectedMonthKey]);

  // Dynamic live calculation based on current form inputs
  const liveApiCost = Math.max(0, parseFloat(apiCostInput) || 0);
  const liveMaintenanceCost = Math.max(0, parseFloat(maintenanceCostInput) || 0);
  const liveMiscCost = Math.max(0, parseFloat(miscCostInput) || 0);
  const liveTotalExpenses = liveApiCost + liveMaintenanceCost + liveMiscCost;
  const liveGrossRevenue = currentMonthData.grossRevenue || 0;
  const liveNetIncome = liveGrossRevenue - liveTotalExpenses;
  const liveMargin = liveGrossRevenue > 0 ? ((liveNetIncome / liveGrossRevenue) * 100) : (liveTotalExpenses > 0 ? -100 : 0);

  // Handle saving expenses
  const handleSaveExpenses = async (e) => {
    e.preventDefault();
    if (!selectedMonthKey) return;

    setSaving(true);
    setSaveStatus(null);

    try {
      const res = await fetch('/api/admin/monthly-revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonthKey,
          apiCost: liveApiCost,
          maintenanceCost: liveMaintenanceCost,
          miscCost: liveMiscCost,
          notes: notesInput,
          adminId: currentUserId
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save expenses');

      setSaveStatus({ type: 'success', message: `Expenses for ${currentMonthData.monthLabel || selectedMonthKey} saved successfully!` });
      // Re-fetch data preserving current selected month
      await fetchRevenueData(selectedMonthKey);
    } catch (err) {
      console.error('Failed to save monthly expenses:', err);
      setSaveStatus({ type: 'error', message: err.message || 'Error saving expenses. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Support role shouldn't see sensitive revenue details
  if (userRole === 'support') {
    return null;
  }

  if (loading && (!data.months || data.months.length === 0)) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 mb-8 shadow-sm text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent mb-3"></div>
        <p className="text-sm font-medium text-slate-500">Loading monthly revenue & income analytics...</p>
      </div>
    );
  }

  const isProfit = liveNetIncome >= 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm mb-8 overflow-hidden transition-all">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Financial Accounting
            </span>
            <span className="text-xs text-slate-400">Squad & Payment Gateways</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Monthly Revenue & Net Profit Calculator
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Track total platform collections, deduct AI API, maintenance, and miscellaneous overheads, and see actual net monthly income.
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/15">
          <label htmlFor="revenue-month-select" className="text-xs font-bold text-slate-300 uppercase px-2">Month:</label>
          <select
            id="revenue-month-select"
            value={selectedMonthKey}
            onChange={(e) => handleSelectMonth(e.target.value)}
            className="bg-slate-900 text-white font-semibold text-sm rounded-lg px-3 py-2 border border-slate-700 outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
          >
            {data.months?.map(m => (
              <option key={m.month} value={m.month} className="bg-slate-900 text-white">
                {m.monthLabel} (₦{m.grossRevenue.toLocaleString()})
              </option>
            ))}
          </select>
          <button
            onClick={() => handleSelectMonth(data.currentMonth)}
            title="Jump to Current Month"
            className={`px-3 py-2 text-xs font-bold rounded-lg transition ${
              selectedMonthKey === data.currentMonth 
                ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            Current
          </button>
        </div>
      </div>

      {/* Main Metric Cards for Selected Month */}
      <div className="p-6 bg-slate-50/50 border-b border-slate-200/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              Performance for {currentMonthData.monthLabel || selectedMonthKey}
            </h3>
            {currentMonthData.hasExpensesRecorded ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Expenses Recorded
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Input Expenses Below
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {currentMonthData.transactionCount} completed payments
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Gross Revenue */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Gross Revenue</span>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              ₦{liveGrossRevenue.toLocaleString()}
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
              <span>{currentMonthData.transactionCount} transactions</span>
              <span className="font-semibold text-emerald-700">Total Collected</span>
            </div>
            {/* Tier breakdown preview */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex gap-2 text-[10px] font-bold text-slate-600">
              <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">Std: ₦{(currentMonthData.tiers?.standard || 0).toLocaleString()}</span>
              <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Prem: ₦{(currentMonthData.tiers?.premium || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Card 2: Total Operating Expenses */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Total Expenses</span>
              <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
              </span>
            </div>
            <div className="text-2xl font-black text-rose-600 tracking-tight">
              ₦{liveTotalExpenses.toLocaleString()}
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
              <span>API + Maint + Misc</span>
              <span className="font-semibold text-rose-600">Deductions</span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex gap-1.5 text-[10px] font-medium text-slate-600 truncate">
              <span>API: ₦{liveApiCost.toLocaleString()}</span>
              <span>•</span>
              <span>Maint: ₦{liveMaintenanceCost.toLocaleString()}</span>
            </div>
          </div>

          {/* Card 3: Net Monthly Income */}
          <div className={`p-5 rounded-xl border shadow-sm relative overflow-hidden ${
            isProfit ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2 text-slate-600">
              <span>Net Monthly Income</span>
              <span className={`p-1.5 rounded-lg ${isProfit ? 'bg-emerald-200/80 text-emerald-900' : 'bg-rose-200/80 text-rose-900'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
            </div>
            <div className={`text-2xl font-black tracking-tight ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
              {liveNetIncome < 0 ? '-' : ''}₦{Math.abs(liveNetIncome).toLocaleString()}
            </div>
            <div className="mt-2 text-xs flex items-center justify-between font-medium">
              <span className="text-slate-600">Take-Home Profit</span>
              <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                isProfit ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
              }`}>
                {isProfit ? 'Profitable' : 'Deficit'}
              </span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[10px] text-slate-500 font-semibold">
              Gross Revenue minus all expenses
            </div>
          </div>

          {/* Card 4: Profit Margin */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Profit Margin</span>
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {liveMargin.toFixed(1)}%
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
              <span>Efficiency ratio</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                liveMargin >= 60 ? 'bg-emerald-100 text-emerald-800' :
                liveMargin >= 30 ? 'bg-blue-100 text-blue-800' :
                liveMargin > 0 ? 'bg-amber-100 text-amber-800' :
                'bg-rose-100 text-rose-800'
              }`}>
                {liveMargin >= 60 ? 'Excellent' : liveMargin >= 30 ? 'Healthy' : liveMargin > 0 ? 'Moderate' : 'Loss'}
              </span>
            </div>
            {/* Visual bar */}
            <div className="mt-3 pt-2.5 border-t border-slate-100">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${isProfit ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, Math.max(0, liveMargin))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Expense Input Form */}
      <div className="p-6 bg-white">
        <form onSubmit={handleSaveExpenses}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Input Operational Expenses for {currentMonthData.monthLabel || selectedMonthKey}</span>
              </h4>
              <p className="text-xs text-slate-500">
                Values update live above. Click &quot;Save Expenses&quot; to store them permanently for this month.
              </p>
            </div>
            {currentMonthData.updatedAt && (
              <span className="text-[11px] text-slate-400">
                Last updated: {new Date(currentMonthData.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Input 1: API Cost */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label htmlFor="input-api-cost" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>1. Cost of API (₦)</span>
                <span className="text-[10px] text-indigo-600 font-semibold lowercase">DeepSeek / AI Tokens</span>
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-sm">₦</span>
                <input
                  id="input-api-cost"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={apiCostInput}
                  onChange={(e) => setApiCostInput(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                AI generation &amp; humanizer token expenses.
              </p>
            </div>

            {/* Input 2: Maintenance Cost */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label htmlFor="input-maintenance-cost" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>2. Maintenance (₦)</span>
                <span className="text-[10px] text-purple-600 font-semibold lowercase">Server / Supabase</span>
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-sm">₦</span>
                <input
                  id="input-maintenance-cost"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={maintenanceCostInput}
                  onChange={(e) => setMaintenanceCostInput(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Hosting, database egress, domain renewals, AWS.
              </p>
            </div>

            {/* Input 3: Miscellaneous Cost */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label htmlFor="input-misc-cost" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>3. Miscellaneous (₦)</span>
                <span className="text-[10px] text-amber-600 font-semibold lowercase">Bank fees / Overheads</span>
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-sm">₦</span>
                <input
                  id="input-misc-cost"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={miscCostInput}
                  onChange={(e) => setMiscCostInput(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Squad transaction charges, marketing, customer support.
              </p>
            </div>
          </div>

          {/* Optional Notes and Submit */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Optional notes for this month (e.g. Server upgrade, Squad promotion month, high DeepSeek usage)..."
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-slate-400 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-lg shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <span>Save Expenses</span>
                </>
              )}
            </button>
          </div>

          {/* Feedback Message */}
          {saveStatus && (
            <div className={`mt-3 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              saveStatus.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {saveStatus.type === 'success' ? (
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : (
                <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
              <span>{saveStatus.message}</span>
            </div>
          )}
        </form>
      </div>

      {/* Historical Monthly Comparison Table Toggle */}
      <div className="border-t border-slate-200 bg-slate-50/70 p-4 flex items-center justify-between">
        <button
          onClick={() => setShowHistoryTable(!showHistoryTable)}
          className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 transition"
        >
          <svg className={`w-4 h-4 transform transition-transform ${showHistoryTable ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          <span>{showHistoryTable ? 'Hide' : 'Show'} Monthly Financial History Table ({data.months?.length || 0} Months)</span>
        </button>

        {data.summary && (
          <div className="text-xs font-semibold text-slate-600 hidden sm:flex items-center gap-4">
            <span>All-Time Gross: <strong className="text-slate-900">₦{data.summary.totalGrossRevenue.toLocaleString()}</strong></span>
            <span>All-Time Expenses: <strong className="text-rose-600">₦{data.summary.totalExpenses.toLocaleString()}</strong></span>
            <span>All-Time Net Income: <strong className="text-emerald-700">₦{data.summary.totalNetIncome.toLocaleString()}</strong></span>
          </div>
        )}
      </div>

      {/* Historical Monthly Table */}
      {showHistoryTable && data.months?.length > 0 && (
        <div className="overflow-x-auto border-t border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Month</th>
                <th className="px-5 py-3 text-right">Gross Revenue</th>
                <th className="px-4 py-3 text-right">API Cost</th>
                <th className="px-4 py-3 text-right">Maintenance</th>
                <th className="px-4 py-3 text-right">Misc</th>
                <th className="px-5 py-3 text-right">Total Expenses</th>
                <th className="px-5 py-3 text-right">Net Income</th>
                <th className="px-4 py-3 text-center">Margin</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {data.months.map((m) => {
                const isCurrent = m.month === selectedMonthKey;
                const mProfit = m.netIncome >= 0;

                return (
                  <tr 
                    key={m.month} 
                    className={`transition hover:bg-slate-50/80 ${isCurrent ? 'bg-indigo-50/40 font-semibold' : ''}`}
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {m.monthLabel}
                        {m.month === data.currentMonth && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Current</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">{m.transactionCount} payments</div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                      ₦{m.grossRevenue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-600">
                      ₦{m.apiCost.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-600">
                      ₦{m.maintenanceCost.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-600">
                      ₦{m.miscCost.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-rose-600">
                      ₦{m.totalExpenses.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold whitespace-nowrap">
                      <span className={mProfit ? 'text-emerald-700' : 'text-rose-700'}>
                        {m.netIncome < 0 ? '-' : ''}₦{Math.abs(m.netIncome).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.profitMargin >= 50 ? 'bg-emerald-100 text-emerald-800' :
                        m.profitMargin > 0 ? 'bg-blue-100 text-blue-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {m.profitMargin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleSelectMonth(m.month)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                          isCurrent 
                            ? 'bg-slate-900 text-white' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isCurrent ? 'Editing' : 'Select'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer with All-Time Totals */}
            {data.summary && (
              <tfoot className="bg-slate-900 text-white font-bold text-xs">
                <tr>
                  <td className="px-5 py-3.5 uppercase tracking-wider">All-Time Total</td>
                  <td className="px-5 py-3.5 text-right text-emerald-400">
                    ₦{data.summary.totalGrossRevenue.toLocaleString()}
                  </td>
                  <td colSpan="3" className="px-4 py-3.5 text-center text-slate-400 text-[11px]">
                    {data.summary.totalTransactions} transactions
                  </td>
                  <td className="px-5 py-3.5 text-right text-rose-300">
                    ₦{data.summary.totalExpenses.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right text-emerald-300">
                    ₦{data.summary.totalNetIncome.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                      {data.summary.overallMargin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3.5"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
