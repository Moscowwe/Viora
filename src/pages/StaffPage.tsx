import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDatabase } from "@/hooks/useDatabase";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { 
  Search, 
  Banknote, 
  Plus, 
  Users, 
  Wallet, 
  Ban, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Edit2, 
  Trash2 
} from "lucide-react";

import { Staff, Transaction } from "@/types";

const StaffPage = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { user } = useAuth();
  const db = useDatabase();
  const [search, setSearch] = useState("");
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const [form, setForm] = useState({ name: "", role: "", phone: "", salary: "" });

  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payStaff, setPayStaff] = useState<Staff | null>(null);
  const [payForm, setPayForm] = useState({ deductions: "0", advances: "0", payrollMonth: "" });
  const [payStaffAdvances, setPayStaffAdvances] = useState<Transaction[]>([]);

  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [advanceStaff, setAdvanceStaff] = useState<Staff | null>(null);
  const [advanceForm, setAdvanceForm] = useState({ amount: "", reason: "" });

  const { data: staffList = [], isLoading, isError, error } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data, error } = await db.from<Staff>("staff").select("*").order("created_at", { ascending: false }) as { data: Staff[] | null, error: any };
      if (error) throw error;
      return data || [];
    },
  });

  const getYearMonth = (d: Date) => d.toISOString().slice(0, 7);
  const today = new Date();
  const currentMonthStr = getYearMonth(today);
  const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const prevMonthStr = getYearMonth(prevMonthDate);

  const { data: payRecords = [] } = useQuery({
    queryKey: ["staff_payments_all"],
    queryFn: async () => {
      const { data, error } = await db.from<Transaction>("transactions").select("*") as { data: Transaction[] | null, error: any };
      if (error) throw error;
      return (data || []).filter(r => r.type === 'expense' && r.category === 'Salaries');
    }
  });

  const { data: advanceRecords = [] } = useQuery({
    queryKey: ["staff_advances_all"],
    queryFn: async () => {
      const { data, error } = await db.from<Transaction>("transactions").select("*") as { data: Transaction[] | null, error: any };
      if (error) throw error;
      return (data || []).filter(r => r.type === 'expense' && r.category === 'Advances');
    }
  });

  const isMonthPaid = (employeeName: string, yearMonth: string) => {
    return payRecords.some(r => {
      if (!r.description.includes(`Salary - ${employeeName}`)) return false;
      if (r.description.includes(yearMonth)) return true;
      if (!r.description.match(/\d{4}-\d{2}/)) return r.date.startsWith(yearMonth);
      return false;
    });
  };

  const isCurrentMonthPaid = (employeeName: string) => isMonthPaid(employeeName, currentMonthStr);
  const isPrevMonthPaid = (employeeName: string) => isMonthPaid(employeeName, prevMonthStr);

  const { data: totalDeductions = 0 } = useQuery({
    queryKey: ["staff_deductions"],
    queryFn: async () => {
      const { data, error } = await db.from<Transaction>("transactions").select("*") as { data: Transaction[] | null, error: any };
      if (error) throw error;
      return (data || []).filter(t => t.category === 'Refunds/Deductions').reduce((sum, t) => sum + Number(t.amount), 0);
    }
  });

  const upsertMutation = useMutation({
    mutationFn: async (employee: Omit<Staff, "id"> & { id?: string }) => {
      if (employee.id) {
        const { error } = await db.from<Staff>("staff").update(employee).eq("id", employee.id);
        if (error) throw error;
      } else {
        const newStaff = { ...employee, id: crypto.randomUUID() };
        const { error } = await db.from<Staff>("staff").insert(newStaff);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setDialogOpen(false);
      toast.success(t('children.save') || "Saved successfully");
      setTimeout(() => window.location.reload(), 500);
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : "Operation failed";
      toast.error(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (employee: Staff) => {
      // 1. Performing deletion
      const { error } = await db.from<Staff>("staff").delete().eq("id", employee.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff record deleted successfully");
      setTimeout(() => window.location.reload(), 500);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const payMutation = useMutation({
    mutationFn: async ({ employee, netPay, deductions, advances }: { employee: Staff; netPay: number; deductions: number; advances: number }) => {
      if (netPay < 0) throw new Error("Net pay cannot be negative");
      
      let description = `Salary - ${employee.name} - ${payForm.payrollMonth}`;
      if (deductions > 0 || advances > 0) {
          description += ` (Deductions: ${deductions}, Advances: ${advances})`;
      }

      const { error } = await db.from<Transaction>("transactions").insert({
        id: crypto.randomUUID(),
        type: 'expense',
        description,
        amount: netPay,
        category: 'Salaries',
        date: new Date().toISOString().slice(0, 10),
        created_by: user?.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff_payments"] });
      toast.success(t('staff.salary_paid') || "Salary processed and logged into Finances");
      setPayDialogOpen(false);
      setTimeout(() => window.location.reload(), 500);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const advanceMutation = useMutation({
    mutationFn: async ({ employee, amount, reason }: { employee: Staff; amount: string; reason: string }) => {
      const advanceAmount = Number(amount);
      if (advanceAmount <= 0) throw new Error("Advance amount must be greater than zero");
      
      const { error } = await db.from<Transaction>("transactions").insert({
        id: crypto.randomUUID(),
        type: 'expense', // Advance is an expense paid OUT right now
        description: `Advance Payment - ${employee.name} ${reason ? `(${reason})` : ''}`,
        amount: advanceAmount,
        category: 'Advances', // New category
        date: new Date().toISOString().slice(0, 10),
        created_by: user?.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Advance paid and applied to finances");
      setAdvanceDialogOpen(false);
      setTimeout(() => window.location.reload(), 500);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const bulkPayMutation = useMutation({
    mutationFn: async () => {
      // Find all staff who haven't been paid this month
      const unpaidStaff = staffList.filter(s => !isCurrentMonthPaid(s.name) && s.salary > 0);
      
      if (unpaidStaff.length === 0) throw new Error("All staff members are already paid for this month");

      for (const employee of unpaidStaff) {
        await db.from<Transaction>("transactions").insert({
          id: crypto.randomUUID(),
          type: 'expense',
          description: `Salary - ${employee.name} - ${currentMonthStr}`,
          amount: employee.salary,
          category: 'Salaries',
          date: new Date().toISOString().slice(0, 10),
          created_by: user?.id
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff_payments"] });
      toast.success("All staff salaries processed successfully");
      setTimeout(() => window.location.reload(), 500);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const handleSave = () => {
    if (!form.name || !form.role) return toast.error("Name and Role are required");
    upsertMutation.mutate({
      ...(editStaff?.id ? { id: editStaff.id } : {}),
      name: form.name,
      role: form.role,
      phone: form.phone,
      salary: Number(form.salary) || 0,
    });
  };

  const openEdit = (employee: Staff) => {
    setEditStaff(employee);
    setForm({ name: employee.name, role: employee.role, phone: employee.phone || "", salary: String(employee.salary) });
    setDialogOpen(true);
  };

  const openAdd = () => {
    const defaultSalary = localStorage.getItem("defaultStaffSalary") || "";
    setEditStaff(null);
    setForm({ name: "", role: "", phone: "", salary: defaultSalary });
    setDialogOpen(true);
  };

  const handlePayrollMonthChange = (monthStr: string, employee: Staff | null = payStaff) => {
    if (!employee) return;
    const staffAdvances = advanceRecords.filter(r => 
        r.description.startsWith(`Advance Payment - ${employee.name}`) && 
        r.date.startsWith(monthStr)
    );
    setPayStaffAdvances(staffAdvances);
    const totalAdvances = staffAdvances.reduce((sum, record) => sum + Number(record.amount), 0);
    setPayForm(prev => ({ ...prev, payrollMonth: monthStr, advances: String(totalAdvances) }));
  };

  const openPay = (employee: Staff) => {
    setPayStaff(employee);
    const defaultMonth = !isPrevMonthPaid(employee.name) ? prevMonthStr : currentMonthStr;
    setPayForm({ deductions: "0", advances: "0", payrollMonth: defaultMonth });
    handlePayrollMonthChange(defaultMonth, employee);
    setPayDialogOpen(true);
  };
  
  const handlePay = () => {
    if (!payStaff) return;
    const deductions = Number(payForm.deductions) || 0;
    const advances = Number(payForm.advances) || 0;
    const netPay = payStaff.salary - deductions - advances;
    payMutation.mutate({ employee: payStaff, netPay, deductions, advances });
  };

  const openAdvance = (employee: Staff) => {
    setAdvanceStaff(employee);
    setAdvanceForm({ amount: "", reason: "" });
    setAdvanceDialogOpen(true);
  };
  
  const handleAdvance = () => {
    if (!advanceStaff || !advanceForm.amount) return toast.error("Amount is required");
    advanceMutation.mutate({ employee: advanceStaff, amount: advanceForm.amount, reason: advanceForm.reason });
  };

  const filtered = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase())
  );

  const totalPayroll = staffList.reduce((acc, curr) => acc + curr.salary, 0);
  const averageSalary = staffList.length > 0 ? Math.round(totalPayroll / staffList.length) : 0;

  return (
    <AdminLayout>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-extrabold text-foreground tracking-tight mb-2 font-headline">{t('staff.title')}</h2>
          <p className="text-foreground text-lg">{t('staff.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
            <input
              className="w-full bg-card border border-sidebar-border rounded-full py-3 px-12 focus:ring-4 focus:ring-baby-blue/20 focus:border-baby-blue outline-none transition-all text-foreground placeholder:text-outline shadow-sm"
              placeholder={t('staff.search')}
              value={search}
              maxLength={100}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { if (confirm("Pay full salaries to all unpaid staff? This will create expense transactions for everyone.")) bulkPayMutation.mutate(); }}
              disabled={bulkPayMutation.isPending}
              className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-bold text-xs hover:bg-emerald-200 transition-all"
            >
              <Banknote size={14} />
              <span>دفع رواتب الكل</span>
            </button>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 bg-baby-blue text-white px-6 py-3 rounded-full font-bold hover:shadow-lg hover:shadow-baby-blue/20 transition-all shrink-0">
            <Plus size={20} />
            <span>{t('staff.add_staff')}</span>
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center shrink-0 text-secondary">
            <Users size={24} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground font-headline">{staffList.length}</div>
            <div className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">{t('staff.total')}</div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
            <Banknote size={24} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground font-headline">{totalPayroll.toLocaleString()} EGP</div>
            <div className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">{t('staff.total_payroll')}</div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center shrink-0 text-tertiary">
            <Wallet size={24} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground font-headline">{averageSalary.toLocaleString()} EGP</div>
            <div className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">{t('staff.average_salary')}</div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-600">
            <Ban size={24} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground font-headline">{totalDeductions.toLocaleString()} EGP</div>
            <div className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">خصومات (Deductions)</div>
          </div>
        </div>
      </div>

      {/* Staff Table Container */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-foreground bg-surface-container-low">
            <Loader2 size={40} className="animate-spin mb-4" />
            <p className="animate-pulse">{t('staff.loading') || "Loading..."}</p>
          </div>
        ) : isError ? (
          <div className="p-8 bg-destructive/10 text-center text-destructive flex flex-col items-center justify-center">
            <AlertCircle size={40} className="mb-4" />
            <p className="font-bold">{t('staff.error')}</p>
            <p className="text-sm mt-1 opacity-80">{(error as Error)?.message || "An unknown error occurred"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-baby-blue/5 text-foreground uppercase text-xs font-black tracking-widest">
                  <th className="px-8 py-5">{t('staff.table_name') || "Name"}</th>
                  <th className="px-8 py-5">{t('staff.table_role') || "Role"}</th>
                  <th className="px-8 py-5">{t('staff.table_phone') || "Phone"}</th>
                  <th className="px-8 py-5 text-center">{t('staff.table_salary') || "Salary"}</th>
                  <th className="px-8 py-5 text-right">{t('staff.table_actions') || "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sidebar-border/50">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-container-low/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary-container/40 flex items-center justify-center text-secondary font-bold font-headline">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-foreground">{s.name}</span>
                          {!isPrevMonthPaid(s.name) && (
                            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full w-max font-bold border border-red-200">
                              ⚠️ متأخرات ({prevMonthStr})
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-foreground font-medium">{s.role}</td>
                    <td className="px-8 py-6 text-foreground font-mono text-sm">{s.phone || "—"}</td>
                    <td className="px-8 py-6 text-center text-foreground">{s.salary.toLocaleString()} EGP</td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openPay(s)}
                          disabled={payMutation.isPending || s.salary <= 0}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-bold uppercase tracking-wide ${
                            isCurrentMonthPaid(s.name) && isPrevMonthPaid(s.name)
                              ? 'bg-emerald-100 text-emerald-700 opacity-100' 
                              : 'bg-tertiary-container/30 text-tertiary hover:bg-tertiary-container hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                          title="Pay Salary"
                        >
                          {isCurrentMonthPaid(s.name) && isPrevMonthPaid(s.name) ? <CheckCircle size={14} /> : <Banknote size={14} />}
                          {isCurrentMonthPaid(s.name) && isPrevMonthPaid(s.name) ? "تم الدفع" : (t('staff.pay_action') || "Pay")}
                        </button>
                        <button
                          onClick={() => openAdvance(s)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-600 hover:bg-orange-500 hover:text-white transition-all text-xs font-bold uppercase tracking-wide disabled:opacity-50"
                          title="Advance Payment"
                        >
                          <Wallet size={14} />
                          سلفة
                        </button>
                        <div className="w-px h-6 bg-sidebar-border mx-1"></div>
                        <button onClick={() => openEdit(s)} className="w-8 h-8 rounded-full hover:bg-surface-container-low/80 flex items-center justify-center text-outline hover:text-baby-blue transition-colors">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => { if (window.confirm(t('staff.confirm_delete') || "Are you sure you want to delete this staff record?")) deleteMutation.mutate(s); }} className="w-8 h-8 rounded-full hover:bg-destructive/10 flex items-center justify-center text-outline hover:text-destructive transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-8 py-12 text-center text-foreground">{isLoading ? t('staff.loading') : t('staff.empty')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-none border-outline-variant/30">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl font-black">{editStaff ? t('staff.edit_title') : t('staff.add_title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {[
              { label: t('staff.field_name'), key: "name" },
              { label: t('staff.field_role'), key: "role" },
              { label: t('staff.field_phone'), key: "phone" },
              { label: t('staff.field_salary'), key: "salary", type: "number" },
            ].map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-sm font-semibold text-foreground">{field.label}</label>
                <input
                  className="w-full bg-surface-container-low border-2 border-primary/20 rounded-none py-3 px-4 text-foreground focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  type={field.type || "text"}
                  maxLength={100}
                  value={form[field.key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                />
              </div>
            ))}
            <button
              onClick={handleSave}
              disabled={upsertMutation.isPending}
              className="w-full bg-primary text-white py-4 rounded-none font-bold text-lg hover:shadow-sm transition-all mt-4 disabled:opacity-60"
            >
              {upsertMutation.isPending ? t('staff.saving') : editStaff ? t('common.save') : t('staff.add_staff')}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay Salary Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-none border-outline-variant/30">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl font-black">Pay Salary</DialogTitle>
            <p className="text-sm text-foreground font-medium mt-1">Processing salary for {payStaff?.name}</p>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground">Payroll Month (شهر الاستحقاق)</label>
              <select
                className="w-full bg-surface-container-low border-2 border-primary/20 rounded-none py-3 px-4 text-foreground focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                value={payForm.payrollMonth}
                onChange={(e) => handlePayrollMonthChange(e.target.value)}
              >
                <option value={prevMonthStr}>الشهر الماضي ({prevMonthStr}) {!isPrevMonthPaid(payStaff?.name || '') ? '⚠️ متأخر' : ''}</option>
                <option value={currentMonthStr}>الشهر الحالي ({currentMonthStr})</option>
              </select>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface-container-low">
                <span className="font-bold text-sm text-foreground">Base Salary</span>
                <span className="font-black text-lg text-foreground">{payStaff?.salary.toLocaleString()} EGP</span>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground flex justify-between">
                  <span>Deductions (خصومات)</span>
                  <span className="text-destructive font-black">-{Number(payForm.deductions || 0).toLocaleString()} EGP</span>
              </label>
              <input
                className="w-full bg-surface-container-low border-2 border-primary/20 rounded-none py-3 px-4 text-foreground focus:ring-2 focus:ring-destructive/20 transition-all font-bold text-xl"
                type="number"
                min="0"
                value={payForm.deductions}
                onChange={(e) => setPayForm({ ...payForm, deductions: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground flex justify-between">
                  <span>Prior Advances (سلف سابقة)</span>
                  <span className="text-orange-500 font-black">-{Number(payForm.advances || 0).toLocaleString()} EGP</span>
              </label>

              {payStaffAdvances.length > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-none p-3 mb-2 space-y-2">
                  {payStaffAdvances.map((adv) => (
                    <div key={adv.id} className="flex justify-between items-center text-xs text-orange-800">
                      <span>{adv.date} {adv.description.replace(`Advance Payment - ${payStaff?.name}`, '')}</span>
                      <span className="font-bold">{Number(adv.amount).toLocaleString()} EGP</span>
                    </div>
                  ))}
                </div>
              )}

              <input
                className="w-full bg-surface-container-low border-2 border-primary/20 rounded-none py-3 px-4 text-foreground focus:ring-2 focus:ring-orange-500/20 transition-all font-bold text-xl"
                type="number"
                min="0"
                value={payForm.advances}
                onChange={(e) => setPayForm({ ...payForm, advances: e.target.value })}
              />
              <p className="text-xs text-outline mt-1">* تم حساب سلف هذا الشهر تلقائياً. يمكنك تعديل الرقم إذا لزم الأمر.</p>
            </div>
            <div className="flex justify-between items-center p-4 bg-emerald-50 border-2 border-emerald-100 mt-4">
                <span className="font-black text-emerald-800 uppercase tracking-widest text-sm">Net Pay (الصافي)</span>
                <span className="font-black text-2xl text-emerald-600">
                    {((payStaff?.salary || 0) - Number(payForm.deductions || 0) - Number(payForm.advances || 0)).toLocaleString()} EGP
                </span>
            </div>
            <button
              onClick={handlePay}
              disabled={payMutation.isPending || ((payStaff?.salary || 0) - Number(payForm.deductions || 0) - Number(payForm.advances || 0)) < 0}
              className="w-full bg-emerald-600 text-white py-4 rounded-none font-bold text-lg hover:shadow-sm transition-all mt-6 disabled:opacity-60 flex justify-center items-center gap-2"
            >
              <Banknote size={20} />
              Confirm & Pay
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Advance Dialog */}
      <Dialog open={advanceDialogOpen} onOpenChange={setAdvanceDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-none border-outline-variant/30">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl font-black text-orange-600">Give Advance</DialogTitle>
            <p className="text-sm text-foreground font-medium mt-1">Recording advance payment for {advanceStaff?.name}</p>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground">Amount (EGP)</label>
              <input
                className="w-full bg-surface-container-low border-2 border-primary/20 rounded-none py-3 px-4 text-foreground focus:ring-2 focus:ring-orange-500/20 transition-all font-bold text-xl"
                type="number"
                placeholder="0.00"
                maxLength={20}
                value={advanceForm.amount}
                onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground">Reason / Notes</label>
              <input
                className="w-full bg-surface-container-low border-2 border-primary/20 rounded-none py-3 px-4 text-foreground focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
                type="text"
                maxLength={100}
                value={advanceForm.reason}
                onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
              />
            </div>
            <button
              onClick={handleAdvance}
              disabled={advanceMutation.isPending}
              className="w-full bg-orange-500 text-white py-4 rounded-none font-bold text-lg hover:shadow-sm transition-all mt-6 disabled:opacity-60 flex justify-center items-center gap-2"
            >
              <Wallet size={20} />
              Submit Advance
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default StaffPage;
