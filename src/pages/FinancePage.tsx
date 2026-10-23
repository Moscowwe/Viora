import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDatabase } from "@/hooks/useDatabase";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { exportProfessionalExcel } from "@/lib/export_report";
import { 
  Download, 
  Plus, 
  TrendingUp, 
  Briefcase, 
  Receipt, 
  TrendingDown, 
  Activity, 
  Loader2, 
  AlertCircle, 
  ArrowDown, 
  ArrowUp, 
  Trash2 
} from "lucide-react";

import { Transaction, Child, Staff } from "@/types";

const FinancePage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useTranslation();
  const db = useDatabase();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ type: "income", description: "", amount: "", date: "", category: "" });

  const { data: transactions = [], isLoading, isError, error } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await db.from<Transaction>("transactions").select("*").order("date", { ascending: false }) as { data: Transaction[] | null, error: any };
      if (error) throw error;
      return data || [];
    },
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data, error } = await db.from<Staff>("staff").select("*") as { data: Staff[] | null, error: any };
      if (error) throw error;
      return data || [];
    },
  });

  const { data: children = [] } = useQuery({
    queryKey: ["children"],
    queryFn: async () => {
      const { data, error } = await db.from<Child>("children").select("*") as { data: Child[] | null, error: any };
      if (error) throw error;
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (tx: { type: string; description: string; amount: number; category: string; date: string }) => {
      const { error } = await db.from<Transaction>("transactions").insert({
        ...tx,
        type: tx.type as "income" | "expense",
        id: crypto.randomUUID(),
        created_by: user?.id,
      }) as { error: any };
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setDialogOpen(false);
      toast.success("Transaction added");
      setTimeout(() => window.location.reload(), 500);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (tx: Transaction) => {
      // 1. Audit log
      try {
        await db.from("audit_logs").insert({
          id: crypto.randomUUID(),
          action: "DELETE_TRANSACTION",
          target_id: tx.id,
          target_name: tx.description,
          user_id: user?.id,
          user_email: user?.email,
          details: JSON.stringify({ amount: tx.amount, type: tx.type, category: tx.category })
        });
      } catch (e) {
        console.error("Audit log failed:", e);
      }

      // 2. Delete
      const { error } = await db.from<Transaction>("transactions").delete().eq("id", tx.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transaction deleted successfully");
      setTimeout(() => window.location.reload(), 500);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const today = new Date();
  const currentMonthString = today.toISOString().slice(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState<string>("all"); // "all" or "YYYY-MM"

  // Derive available months from transactions
  const availableMonths = Array.from(new Set(transactions.map(t => t.date?.slice(0, 7) || ""))).filter(Boolean).sort().reverse();
  // Ensure current month is in the list even if no txs yet
  if (!availableMonths.includes(currentMonthString)) {
    availableMonths.unshift(currentMonthString);
    availableMonths.sort().reverse();
  }

  const filteredTxs = selectedMonth === "all" 
    ? transactions 
    : transactions.filter(t => t.date.startsWith(selectedMonth));

  const totalIncome = filteredTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalSalaries = filteredTxs.filter(t => t.type === 'expense' && t.category === 'Salaries').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const otherExpenses = filteredTxs.filter(t => t.type === 'expense' && t.category !== 'Salaries').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpenses = totalSalaries + otherExpenses;
  const netProfit = totalIncome - totalExpenses;

  const handleAdd = () => {
    if (!form.description || !form.amount) return toast.error("Description and amount required");
    addMutation.mutate({
      type: form.type,
      description: form.description,
      amount: Number(form.amount),
      category: form.category || "Other",
      date: form.date || new Date().toISOString().slice(0, 10),
    });
    setForm({ type: "income", description: "", amount: "", date: "", category: "" });
  };

  const handleExport = () => {
    exportProfessionalExcel(transactions, staff, children);
  };

  return (
    <AdminLayout>
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-primary font-headline">{t('finance.title')}</h2>
          <p className="text-foreground font-medium">{t('finance.subtitle')}</p>
        </div>
        <div className="flex gap-4 items-center">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-3 rounded-full bg-surface-container border-2 border-outline-variant/30 text-foreground font-bold text-sm cursor-pointer appearance-none min-w-[150px] text-center"
          >
            <option value="all">{t('finance.all_time') || "All Time"}</option>
            {availableMonths.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 rounded-full bg-secondary-container text-secondary font-bold tactile-card-bold text-sm transition-all">
            <Download size={20} />
            {t('finance.export')}
          </button>
          <button onClick={() => setDialogOpen(true)} className="flex items-center gap-2 px-6 py-3 rounded-full bg-baby-pink text-primary font-bold tactile-card-bold text-sm transition-all">
            <Plus size={20} />
            {t('finance.add_tx')}
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-card rounded-2xl p-6 border border-border/80 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center justify-center">
              <TrendingUp size={24} className="text-secondary" />
            </div>
            <span className="text-xs font-black text-secondary uppercase tracking-widest">{t('admin.income')}</span>
          </div>
          <div>
            <p className="text-foreground text-sm font-bold mb-1">{t('admin.total_income')}</p>
            <h3 className="text-2xl font-extrabold font-headline text-foreground">{totalIncome.toLocaleString()} EGP</h3>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 border border-border/80 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between text-indigo-600">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center justify-center">
              <Briefcase size={24} className="text-indigo-600" />
            </div>
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{t('admin.total_salaries')}</span>
          </div>
          <div>
            <p className="text-foreground text-sm font-bold mb-1">{t('admin.total_salaries')}</p>
            <h3 className="text-2xl font-extrabold font-headline">{totalSalaries.toLocaleString()} EGP</h3>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 border border-border/80 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between text-orange-600">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center justify-center">
              <Receipt size={24} className="text-orange-600" />
            </div>
            <span className="text-xs font-black text-orange-600 uppercase tracking-widest">{t('admin.other_expenses')}</span>
          </div>
          <div>
            <p className="text-foreground text-sm font-bold mb-1">{t('admin.other_expenses')}</p>
            <h3 className="text-2xl font-extrabold font-headline">{otherExpenses.toLocaleString()} EGP</h3>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 border border-border/80 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between text-rose-600">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center justify-center">
              <TrendingDown size={24} className="text-rose-600" />
            </div>
            <span className="text-xs font-black text-rose-600 uppercase tracking-widest">{t('admin.salaries_and_expenses')}</span>
          </div>
          <div>
            <p className="text-foreground text-sm font-bold mb-1">{t('admin.salaries_and_expenses')}</p>
            <h3 className="text-2xl font-extrabold font-headline">{totalExpenses.toLocaleString()} EGP</h3>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 border border-border/80 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center justify-center">
              <Activity size={24} className="text-emerald-600" />
            </div>
            <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">{t('admin.net_profit')}</span>
          </div>
          <div>
            <p className="text-foreground text-sm font-bold mb-1">{t('admin.net_profit')}</p>
            <h3 className={`text-2xl font-extrabold font-headline ${netProfit >= 0 ? "text-green-600" : "text-destructive"}`}>
              {netProfit.toLocaleString()} EGP
            </h3>
          </div>
        </div>
      </section>

      {/* Transactions */}
      <section className="bg-card rounded-none p-6 border border-outline-variant/30">
        <h4 className="text-2xl font-black font-headline text-foreground mb-6">{t('finance.history')}</h4>
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-foreground bg-surface-container-low rounded-xl">
            <Loader2 size={40} className="animate-spin mb-4" />
            <p className="animate-pulse">{t('finance.loading')}</p>
          </div>
        ) : isError ? (
          <div className="py-12 bg-destructive/10 rounded-xl text-center text-destructive flex flex-col items-center justify-center border border-destructive/20 mt-4">
            <AlertCircle size={40} className="mb-4" />
            <p className="font-bold">{t('finance.error')}</p>
            <p className="text-sm mt-1 opacity-80">{error instanceof Error ? error.message : "An unknown error occurred"}</p>
          </div>
        ) : filteredTxs.length === 0 ? (
          <div className="py-12 text-center text-foreground">{t('finance.empty')}</div>
        ) : (
          <div className="space-y-3">
            {filteredTxs.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl hover:bg-surface-container-low/80 border border-transparent hover:border-surface-container-highest/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${t.type === "income" ? "bg-baby-blue/15 text-secondary" : "bg-baby-pink/15 text-primary"}`}>
                    {t.type === "income" ? <ArrowDown size={20} /> : <ArrowUp size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{t.description}</p>
                    <p className="text-xs text-foreground">{t.category || "Other"} • {t.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xl font-black ${t.type === "income" ? "text-green-600" : "text-destructive"}`}>
                    {t.type === "income" ? "+" : "-"}${t.amount.toLocaleString()}
                  </span>
                  <button onClick={() => { if (window.confirm("Are you sure you want to delete this transaction?")) deleteMutation.mutate(t); }} className="text-outline hover:text-destructive transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-none border-outline-variant/30">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl font-black">{t('finance.add_tx')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex gap-3">
              <button
                onClick={() => setForm({ ...form, type: "income" })}
                className={`flex-1 py-3 rounded-full font-bold text-sm transition-all ${form.type === "income" ? "bg-baby-blue text-white" : "bg-surface-container-low text-foreground"}`}
              >
                {t('finance.type_income')}
              </button>
              <button
                onClick={() => setForm({ ...form, type: "expense" })}
                className={`flex-1 py-3 rounded-full font-bold text-sm transition-all ${form.type === "expense" ? "bg-baby-pink text-primary" : "bg-surface-container-low text-foreground"}`}
              >
                {t('finance.type_expense')}
              </button>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground">{t('finance.field_desc')}</label>
              <input
                className="w-full bg-surface-container-low border-2 border-primary/20 rounded-none py-3 px-4 text-foreground focus:ring-2 focus:ring-primary/20 transition-all"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground">{t('finance.field_amount')}</label>
              <input
                className="w-full bg-surface-container-low border-2 border-primary/20 rounded-none py-3 px-4 text-foreground focus:ring-2 focus:ring-primary/20 transition-all"
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground">{t('finance.field_cat')}</label>
              {form.type === "expense" ? (
                <select
                  className="w-full bg-surface-container-low border-2 border-primary/20 rounded-none py-3 px-4 text-foreground focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Select Category</option>
                  <option value="Salaries">Salaries (مرتبات)</option>
                  <option value="Rent">Rent (إيجار)</option>
                  <option value="Utilities">Utilities (فواتير/كهرباء/مياه)</option>
                  <option value="Supplies">Supplies (مستلزمات)</option>
                  <option value="Maintenance">Maintenance (صيانة)</option>
                  <option value="Activities">Activities (أنشطة ورحلات)</option>
                  <option value="Other">Other (أخرى)</option>
                </select>
              ) : (
                <select
                  className="w-full bg-surface-container-low border-2 border-primary/20 rounded-none py-3 px-4 text-foreground focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Select Category</option>
                  <option value="Tuition Fees">Tuition Fees (رسوم دراسية)</option>
                  <option value="Registration">Registration (رسوم تسجيل)</option>
                  <option value="Activities">Activities (رسوم أنشطة)</option>
                  <option value="Other">Other (أخرى)</option>
                </select>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground">{t('finance.field_date')}</label>
              <input
                className="w-full bg-surface-container-low border-2 border-primary/20 rounded-none py-3 px-4 text-foreground focus:ring-2 focus:ring-primary/20 transition-all"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={addMutation.isPending}
              className="w-full bg-primary text-white py-4 rounded-none font-bold text-lg hover:shadow-sm transition-all mt-4 disabled:opacity-60"
            >
              {addMutation.isPending ? t('children.saving') : t('finance.add_tx')}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default FinancePage;
