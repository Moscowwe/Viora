import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDatabase } from "@/hooks/useDatabase";
import AdminLayout from "@/components/AdminLayout";
import { useTranslation } from "react-i18next";
import { Printer, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

import { Transaction } from "@/types";

type ArchiveReport = {
  id: string;
  month_name: string;
  created_at: string;
  report_data: {
    kpis: {
      totalRevenue: number;
      totalSalaries: number;
      totalAdvances: number;
      otherExpenses: number;
      totalExpenses: number;
      netProfit: number;
    };
    transactions: Transaction[];
  };
};

const formatCurrency = (amount: number) => {
  return `${amount.toLocaleString()} EGP`;
};

const MinimalistReportPage = ({ children, title, monthName, nurseryName = "Prodigy", dateRange }: { children: React.ReactNode, title: string, monthName?: string, nurseryName?: string, dateRange?: string }) => {
  const now = new Date();
  const dateEn = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const timeEn = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="relative bg-white text-black overflow-hidden print:m-0 print:p-0 page-break min-h-[1050px] flex flex-col p-10 print:p-0 border border-slate-200 print:border-none font-sans">
      {/* Modern Minimalist Header */}
      <div className="flex justify-between items-end border-b-4 border-slate-900 pb-6 mb-8">
        <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">{nurseryName}</h1>
            <h2 className="text-sm font-bold text-slate-500 tracking-widest uppercase mt-1">Official Financial Record</h2>
        </div>
        <div className="text-right">
            <div className="text-2xl font-black text-slate-900 uppercase tracking-tight">{monthName}</div>
            <div className="text-xs font-bold text-slate-500 mt-1">{dateRange}</div>
        </div>
      </div>

      {/* Title */}
      <div className="mb-8">
        <h3 className="text-xl font-black uppercase tracking-widest text-slate-800 bg-slate-100 inline-block px-4 py-2 rounded-md">{title}</h3>
      </div>

      {/* Content */}
      <div className="flex-grow">
        {children}
      </div>

      {/* Minimalist Footer */}
      <div className="pt-6 mt-8 border-t border-slate-200 flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
        <div>Generated: {dateEn} {timeEn}</div>
        <div>Strictly Confidential</div>
      </div>
    </div>
  );
};

const ReportsPage = () => {
  useTranslation();
  const db = useDatabase();
  const queryClient = useQueryClient();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const { user } = useAuth();
  const nurseryName = user?.display_name || user?.email?.split('@')[0] || "Prodigy";

  const today = new Date();
  
  // Current Month definitions
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
  const currentMonthNameEn = today.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const currentMonthNameAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'][today.getMonth()];
  const currentMonthTitle = `${currentMonthNameEn} (${currentMonthNameAr})`;

  // Prev Month definitions
  const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const prevMonthStart = prevMonthDate.toISOString().slice(0, 10);
  const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().slice(0, 10);
  const prevMonthNameEn = prevMonthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const prevMonthNameAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'][prevMonthDate.getMonth()];
  const prevMonthTitle = `${prevMonthNameEn} (${prevMonthNameAr})`;

  const { data: archives = [] } = useQuery({
    queryKey: ["archive_reports"],
    queryFn: async () => {
      const { data, error } = await db.from<{ id: string; month_name: string; created_at: string; report_data: string }>("archive_reports").select("*").order("created_at", { ascending: false }) as { data: { id: string; month_name: string; created_at: string; report_data: string }[] | null, error: any };
      if (error) throw error;
      return (data || []).map(r => ({
        ...r,
        report_data: JSON.parse(r.report_data)
      })) as ArchiveReport[];
    },
  });

  const { data: allTransactions = [] } = useQuery({
    queryKey: ["all_transactions_for_reports"],
    queryFn: async () => {
      const { data, error } = await db.from<Transaction>('transactions').select('*') as { data: Transaction[] | null, error: any };
      if (error) throw error;
      return data || [];
    }
  });

  const archiveMutation = useMutation({
    mutationFn: async (reportData: ArchiveReport) => {
      const { error } = await db.from("archive_reports").insert({
        id: reportData.id,
        month_name: reportData.month_name,
        created_at: reportData.created_at,
        report_data: JSON.stringify(reportData.report_data)
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archive_reports"] });
    }
  });

  // Auto-Archiving Logic
  useEffect(() => {
    if (archives.length > 0 || allTransactions.length > 0) {
      // Check if prev month is archived
      const isPrevArchived = archives.some(r => r.month_name === prevMonthTitle);
      
      // We only auto-archive if there are actually transactions in the previous month
      const prevTxs = allTransactions.filter(t => t.date >= prevMonthStart && t.date <= prevMonthEnd);
      
      if (!isPrevArchived && prevTxs.length > 0) {
        console.log("Auto-archiving previous month:", prevMonthTitle);
        
        const totalRevenue = prevTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const totalSalaries = prevTxs.filter(t => t.type === 'expense' && t.category === 'Salaries').reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const totalAdvances = prevTxs.filter(t => t.type === 'expense' && t.category === 'Advances').reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const otherExpenses = prevTxs.filter(t => t.type === 'expense' && !['Salaries', 'Advances'].includes(t.category)).reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const totalExpenses = totalSalaries + totalAdvances + otherExpenses;

        const newArchive: ArchiveReport = {
          id: crypto.randomUUID(),
          month_name: prevMonthTitle,
          created_at: new Date().toISOString(),
          report_data: {
            kpis: {
              totalRevenue,
              totalSalaries,
              totalAdvances,
              otherExpenses,
              totalExpenses,
              netProfit: totalRevenue - totalExpenses
            },
            transactions: prevTxs
          }
        };
        
        archiveMutation.mutate(newArchive);
      }
    }
  }, [archives, allTransactions, prevMonthTitle, prevMonthStart, prevMonthEnd]);

  // Current Live Data strictly filtered
  const liveTxs = allTransactions.filter(t => t.date >= currentMonthStart && t.date <= currentMonthEnd);
  
  const liveTotalRevenue = liveTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const liveTotalSalaries = liveTxs.filter(t => t.type === 'expense' && t.category === 'Salaries').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const liveTotalAdvances = liveTxs.filter(t => t.type === 'expense' && t.category === 'Advances').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const liveOtherExpenses = liveTxs.filter(t => t.type === 'expense' && !['Salaries', 'Advances'].includes(t.category)).reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const liveTotalExpenses = liveTotalSalaries + liveTotalAdvances + liveOtherExpenses;

  const liveData: ArchiveReport = {
    id: "live",
    month_name: currentMonthTitle,
    created_at: new Date().toISOString(),
    report_data: {
      kpis: {
          totalRevenue: liveTotalRevenue,
          totalSalaries: liveTotalSalaries,
          totalAdvances: liveTotalAdvances,
          otherExpenses: liveOtherExpenses,
          totalExpenses: liveTotalExpenses,
          netProfit: liveTotalRevenue - liveTotalExpenses
      },
      transactions: liveTxs
    }
  };

  const selectedReport = selectedReportId === "live" ? liveData : archives.find(r => r.id === selectedReportId) || null;
  const isLiveSelected = selectedReportId === "live";

  const handlePrint = () => {
    window.print();
  };

  const incomeTxs = selectedReport?.report_data.transactions.filter(t => t.type === 'income') || [];
  const expenseTxs = selectedReport?.report_data.transactions.filter(t => t.type === 'expense') || [];

  return (
    <AdminLayout>
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center print:hidden border-b pb-6">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter text-foreground font-headline">FINANCIAL REPORTS</h2>
          <p className="text-foreground font-medium text-sm mt-1">Smart Auto-Archiving Monthly Ledgers.</p>
        </div>
        <div className="flex bg-surface-container-low/80 rounded-lg p-1">
           <a href="/admin" className="px-4 py-2 rounded-md font-bold text-xs text-foreground hover:text-foreground transition-all">Overview</a>
           <div className="px-4 py-2 rounded-md font-bold text-xs bg-card text-foreground shadow-sm italic">Reports</div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Master Selector */}
        <div className="lg:w-[300px] shrink-0 flex flex-col gap-2 print:hidden">
            <button 
                onClick={() => setSelectedReportId("live")}
                className={`text-left p-5 rounded-2xl border-2 transition-all ${selectedReportId === "live" ? 'bg-slate-900 border-slate-900 text-white dark:bg-primary dark:border-primary dark:text-primary-foreground' : 'bg-orange-50 border-orange-100 text-orange-950 hover:bg-orange-100/50 dark:bg-orange-950/20 dark:border-orange-900/50 dark:text-orange-200 dark:hover:bg-orange-950/40'}`}
            >
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Status: Running</span>
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse"></div>
                </div>
                <div className="font-extrabold text-xl font-headline">Current Month</div>
                <div className="text-[10px] mt-1 italic opacity-60">{currentMonthStart} to {currentMonthEnd}</div>
            </button>

            <h3 className="font-black mt-6 text-foreground uppercase tracking-widest text-[9px] mb-2 px-2 opacity-50">Locked Archives</h3>
            
            {archives.length === 0 ? (
                <div className="bg-card border border-surface-container-highest/10 rounded-xl p-8 text-center">
                    <p className="text-[10px] font-black text-outline opacity-30 italic">No historical archives available</p>
                </div>
            ) : (
                archives.map(report => (
                    <button 
                        key={report.id}
                        onClick={() => setSelectedReportId(report.id)}
                        className={`text-left px-5 py-4 rounded-xl border-2 transition-all ${selectedReportId === report.id ? 'bg-slate-900 border-slate-900 text-white dark:bg-primary dark:border-primary dark:text-primary-foreground' : 'bg-card border-slate-100 text-slate-800 hover:border-slate-300 shadow-sm dark:border-outline-variant/20 dark:text-foreground'}`}
                    >
                        <div className="font-bold text-sm tracking-tight">{report.month_name}</div>
                        <div className="text-[8px] font-medium uppercase opacity-50 font-mono tracking-widest mt-0.5">Archived: {new Date(report.created_at).toLocaleDateString()}</div>
                    </button>
                ))
            )}
        </div>

        {/* MINIMALIST REPORT VIEW */}
        <div className="flex-grow w-full max-w-[900px] mb-20">
          {selectedReport ? (
            <div className="flex flex-col gap-0 border border-slate-200 dark:border-outline-variant/30 rounded-3xl overflow-hidden print:border-none print:rounded-none bg-surface-container-low shadow-sm">
              
              <div className="print:hidden flex justify-end p-6 bg-slate-50 dark:bg-surface-container border-b border-slate-200 dark:border-outline-variant/30">
                <button onClick={handlePrint} className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95">
                    <Printer size={18} />
                    Print Minimalist Report (PDF)
                </button>
              </div>

              <div id="printable-area" className="print:block bg-white text-black dark:bg-white dark:text-black">
                
                <MinimalistReportPage 
                    title="Financial Summary (ملخص مالي)" 
                    monthName={selectedReport.month_name} 
                    nurseryName={nurseryName}
                    dateRange={isLiveSelected ? `Live Data: ${currentMonthStart} to ${currentMonthEnd}` : `Locked Archive`}
                >
                    {/* KPI CARDS */}
                    <div className="grid grid-cols-3 gap-6 mb-12">
                        <div className="border border-slate-200 p-6 rounded-2xl bg-slate-50">
                            <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Total Revenue (إيرادات)</div>
                            <div className="text-2xl font-black text-slate-900">{formatCurrency(selectedReport.report_data.kpis.totalRevenue)}</div>
                        </div>
                        <div className="border border-slate-200 p-6 rounded-2xl bg-slate-50">
                            <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Total Expenses (مصروفات)</div>
                            <div className="text-2xl font-black text-red-700">-{formatCurrency(selectedReport.report_data.kpis.totalExpenses)}</div>
                        </div>
                        <div className="border-2 border-slate-900 p-6 rounded-2xl bg-slate-900 text-white">
                            <div className="text-xs font-black text-slate-300 uppercase tracking-widest mb-2">Net Profit (صافي الربح)</div>
                            <div className={`text-3xl font-black ${selectedReport.report_data.kpis.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                {formatCurrency(selectedReport.report_data.kpis.netProfit)}
                            </div>
                        </div>
                    </div>

                    {/* EXPENSE BREAKDOWN */}
                    <div className="mb-10">
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b-2 border-slate-200 pb-2 mb-4">Expenses Breakdown (تفصيل المصروفات)</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="text-xs font-bold text-slate-600 uppercase">Salaries (رواتب)</span>
                                <span className="font-black text-slate-900">{formatCurrency(selectedReport.report_data.kpis.totalSalaries)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                                <span className="text-xs font-bold text-orange-800 uppercase">Advances (سلف)</span>
                                <span className="font-black text-orange-900">{formatCurrency(selectedReport.report_data.kpis.totalAdvances)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="text-xs font-bold text-slate-600 uppercase">Other (أخرى)</span>
                                <span className="font-black text-slate-900">{formatCurrency(selectedReport.report_data.kpis.otherExpenses)}</span>
                            </div>
                        </div>
                    </div>

                    {/* INCOME TABLE */}
                    <div className="mb-10 page-break-inside-avoid">
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b-2 border-slate-200 pb-2 mb-4">Income Entries (حركة الإيرادات)</h4>
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="text-xs text-slate-500 uppercase tracking-widest">
                                    <th className="py-2 border-b border-slate-200">Date</th>
                                    <th className="py-2 border-b border-slate-200">Category</th>
                                    <th className="py-2 border-b border-slate-200">Description</th>
                                    <th className="py-2 border-b border-slate-200 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incomeTxs.length > 0 ? incomeTxs.map((tx, i) => (
                                    <tr key={i} className="border-b border-slate-100">
                                        <td className="py-3 text-slate-500 font-mono text-xs">{tx.date}</td>
                                        <td className="py-3 font-bold text-slate-700">{tx.category || 'General'}</td>
                                        <td className="py-3 text-slate-600">{tx.description}</td>
                                        <td className="py-3 text-right font-black text-emerald-600">+{formatCurrency(tx.amount)}</td>
                                    </tr>
                                )) : <tr><td colSpan={4} className="py-8 text-center text-slate-400 italic text-xs uppercase tracking-widest">No income recorded this month</td></tr>}
                            </tbody>
                        </table>
                    </div>

                    {/* EXPENSE TABLE */}
                    <div className="page-break-inside-avoid">
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b-2 border-slate-200 pb-2 mb-4">Expense Entries (حركة المصروفات)</h4>
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="text-xs text-slate-500 uppercase tracking-widest">
                                    <th className="py-2 border-b border-slate-200">Date</th>
                                    <th className="py-2 border-b border-slate-200">Category</th>
                                    <th className="py-2 border-b border-slate-200">Description</th>
                                    <th className="py-2 border-b border-slate-200 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenseTxs.length > 0 ? expenseTxs.map((tx, i) => (
                                    <tr key={i} className="border-b border-slate-100">
                                        <td className="py-3 text-slate-500 font-mono text-xs">{tx.date}</td>
                                        <td className="py-3 font-bold text-slate-700">{tx.category}</td>
                                        <td className="py-3 text-slate-600">{tx.description}</td>
                                        <td className="py-3 text-right font-black text-rose-600">-{formatCurrency(tx.amount)}</td>
                                    </tr>
                                )) : <tr><td colSpan={4} className="py-8 text-center text-slate-400 italic text-xs uppercase tracking-widest">No expenses recorded this month</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </MinimalistReportPage>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center p-14 text-center h-[650px] print:hidden">
              <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center mb-6 shadow-inner">
                <ShieldCheck size={64} className="text-slate-300" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-3 font-headline uppercase italic">Report Ready</h3>
              <p className="text-slate-500 font-bold max-w-lg mx-auto text-sm leading-relaxed italic uppercase tracking-tighter">
                Please finalize your selection from the audited archives to generate a professional minimalist financial document.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ReportsPage;
