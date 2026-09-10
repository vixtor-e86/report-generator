// src/app/api/admin/monthly-revenue/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function formatMonthLabel(monthKey) {
  try {
    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch (e) {
    return monthKey;
  }
}

export async function GET(request) {
  try {
    // 1. Fetch all paid transactions with pagination support
    let allPayments = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: payments, error: txError } = await supabaseAdmin
        .from('payment_transactions')
        .select('amount, created_at, tier, paystack_reference')
        .eq('status', 'paid')
        .range(from, from + 999);

      if (txError) {
        console.error('[MonthlyRevenue] Payment Fetch Error:', txError);
        break;
      }

      if (payments && payments.length > 0) {
        allPayments = allPayments.concat(payments);
        if (payments.length < 1000) {
          hasMore = false;
        } else {
          from += 1000;
        }
      } else {
        hasMore = false;
      }
    }

    // 2. Fetch all saved monthly expenses from admin_logs
    const { data: expenseLogs, error: logError } = await supabaseAdmin
      .from('admin_logs')
      .select('*')
      .eq('action', 'monthly_expense');

    if (logError) {
      console.warn('[MonthlyRevenue] Expense Logs Error:', logError);
    }

    const expensesMap = {};
    if (expenseLogs && expenseLogs.length > 0) {
      for (const log of expenseLogs) {
        const d = log.details;
        if (d && d.month) {
          // If duplicate exists, keep latest
          const prev = expensesMap[d.month];
          if (!prev || new Date(log.created_at || d.updated_at) > new Date(prev.updatedAt || 0)) {
            expensesMap[d.month] = {
              id: log.id,
              apiCost: Number(d.api_cost) || 0,
              maintenanceCost: Number(d.maintenance_cost) || 0,
              miscCost: Number(d.misc_cost) || 0,
              notes: d.notes || '',
              updatedAt: d.updated_at || log.created_at
            };
          }
        }
      }
    }

    // 3. Aggregate payments by month (YYYY-MM)
    const monthlyDataMap = {};

    for (const tx of allPayments) {
      if (!tx.created_at) continue;
      const monthKey = tx.created_at.slice(0, 7); // 'YYYY-MM'
      if (!monthlyDataMap[monthKey]) {
        monthlyDataMap[monthKey] = {
          grossRevenue: 0,
          transactionCount: 0,
          tiers: { standard: 0, premium: 0, unlock: 0, other: 0 },
          gateways: { squad: 0, flutterwave: 0, paystack: 0, manual: 0 }
        };
      }

      const amt = tx.amount || 0;
      monthlyDataMap[monthKey].grossRevenue += amt;
      monthlyDataMap[monthKey].transactionCount += 1;

      // Tier breakdown
      const tierKey = (tx.tier || '').toLowerCase();
      if (tierKey.includes('prem')) monthlyDataMap[monthKey].tiers.premium += amt;
      else if (tierKey.includes('stand')) monthlyDataMap[monthKey].tiers.standard += amt;
      else if (tierKey.includes('unlock')) monthlyDataMap[monthKey].tiers.unlock += amt;
      else monthlyDataMap[monthKey].tiers.other += amt;

      // Gateway breakdown heuristic from reference
      const ref = (tx.paystack_reference || '').toUpperCase();
      if (ref.startsWith('SQ_') || ref.includes('SQUAD')) {
        monthlyDataMap[monthKey].gateways.squad += amt;
      } else if (ref.startsWith('FLW') || ref.includes('FLUTTERWAVE')) {
        monthlyDataMap[monthKey].gateways.flutterwave += amt;
      } else if (ref.startsWith('W3WL_MANUAL')) {
        monthlyDataMap[monthKey].gateways.manual += amt;
      } else {
        monthlyDataMap[monthKey].gateways.paystack += amt;
      }
    }

    // Ensure current month is always present
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    if (!monthlyDataMap[currentMonthKey]) {
      monthlyDataMap[currentMonthKey] = {
        grossRevenue: 0,
        transactionCount: 0,
        tiers: { standard: 0, premium: 0, unlock: 0, other: 0 },
        gateways: { squad: 0, flutterwave: 0, paystack: 0, manual: 0 }
      };
    }

    // Add any months that only exist in expenses
    for (const monthKey of Object.keys(expensesMap)) {
      if (!monthlyDataMap[monthKey]) {
        monthlyDataMap[monthKey] = {
          grossRevenue: 0,
          transactionCount: 0,
          tiers: { standard: 0, premium: 0, unlock: 0, other: 0 },
          gateways: { squad: 0, flutterwave: 0, paystack: 0, manual: 0 }
        };
      }
    }

    // 4. Build combined array
    const sortedMonthKeys = Object.keys(monthlyDataMap).sort((a, b) => b.localeCompare(a));
    const months = sortedMonthKeys.map(key => {
      const data = monthlyDataMap[key];
      const exp = expensesMap[key];

      const grossRevenue = data.grossRevenue;
      const apiCost = exp ? exp.apiCost : 0;
      const maintenanceCost = exp ? exp.maintenanceCost : 0;
      const miscCost = exp ? exp.miscCost : 0;
      const totalExpenses = apiCost + maintenanceCost + miscCost;
      const netIncome = grossRevenue - totalExpenses;
      const profitMargin = grossRevenue > 0 ? Number(((netIncome / grossRevenue) * 100).toFixed(1)) : (totalExpenses > 0 ? -100 : 0);

      return {
        month: key,
        monthLabel: formatMonthLabel(key),
        grossRevenue,
        transactionCount: data.transactionCount,
        apiCost,
        maintenanceCost,
        miscCost,
        totalExpenses,
        netIncome,
        profitMargin,
        notes: exp ? exp.notes : '',
        hasExpensesRecorded: !!exp,
        updatedAt: exp ? exp.updatedAt : null,
        tiers: data.tiers,
        gateways: data.gateways
      };
    });

    // 5. Overall Summary
    const totalGrossRevenue = months.reduce((s, m) => s + m.grossRevenue, 0);
    const totalExpenses = months.reduce((s, m) => s + m.totalExpenses, 0);
    const totalNetIncome = totalGrossRevenue - totalExpenses;
    const totalTransactions = months.reduce((s, m) => s + m.transactionCount, 0);
    const overallMargin = totalGrossRevenue > 0 ? Number(((totalNetIncome / totalGrossRevenue) * 100).toFixed(1)) : 0;

    return NextResponse.json({
      success: true,
      currentMonth: currentMonthKey,
      summary: {
        totalGrossRevenue,
        totalExpenses,
        totalNetIncome,
        totalTransactions,
        overallMargin
      },
      months
    });

  } catch (error) {
    console.error('[MonthlyRevenue] Fatal Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { month, apiCost, maintenanceCost, miscCost, notes, adminId } = body;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Valid month format (YYYY-MM) is required' }, { status: 400 });
    }

    const cleanApiCost = Math.max(0, Number(apiCost) || 0);
    const cleanMaintenanceCost = Math.max(0, Number(maintenanceCost) || 0);
    const cleanMiscCost = Math.max(0, Number(miscCost) || 0);
    const cleanNotes = String(notes || '').trim();

    // Fetch existing expense log for this month
    const { data: logs, error: searchError } = await supabaseAdmin
      .from('admin_logs')
      .select('*')
      .eq('action', 'monthly_expense');

    if (searchError) {
      console.error('[MonthlyRevenue] Search Error:', searchError);
      throw searchError;
    }

    const existingLog = logs?.find(l => l.details?.month === month);

    const expenseDetails = {
      month,
      api_cost: cleanApiCost,
      maintenance_cost: cleanMaintenanceCost,
      misc_cost: cleanMiscCost,
      notes: cleanNotes,
      updated_at: new Date().toISOString()
    };

    if (existingLog) {
      const { error: updateError } = await supabaseAdmin
        .from('admin_logs')
        .update({
          details: expenseDetails,
          admin_id: adminId || existingLog.admin_id
        })
        .eq('id', existingLog.id);

      if (updateError) throw updateError;
    } else {
      let resolvedAdminId = adminId;
      if (!resolvedAdminId) {
        const { data: adminUser } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('role', 'admin')
          .limit(1)
          .maybeSingle();
        resolvedAdminId = adminUser?.id || null;
      }

      const { error: insertError } = await supabaseAdmin
        .from('admin_logs')
        .insert({
          admin_id: resolvedAdminId,
          action: 'monthly_expense',
          details: expenseDetails
        });

      if (insertError) throw insertError;
    }

    const totalExpenses = cleanApiCost + cleanMaintenanceCost + cleanMiscCost;

    return NextResponse.json({
      success: true,
      message: 'Monthly expenses saved and income calculated successfully',
      expense: {
        month,
        apiCost: cleanApiCost,
        maintenanceCost: cleanMaintenanceCost,
        miscCost: cleanMiscCost,
        totalExpenses,
        notes: cleanNotes,
        updatedAt: expenseDetails.updated_at
      }
    });

  } catch (error) {
    console.error('[MonthlyRevenue] Save Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
