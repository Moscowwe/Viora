import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useDatabase } from "@/hooks/useDatabase";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { 
  Search, 
  Archive, 
  Plus, 
  Users, 
  Receipt, 
  Percent, 
  TrendingUp, 
  Clock, 
  Loader2, 
  Edit2, 
  Trash2, 
  User, 
  Phone,
  Banknote
} from "lucide-react";

import { Child, Transaction, Staff } from "@/types";

const statusStyles: Record<string, string> = {
  Paid: "bg-green-500/10 text-green-600 dark:text-green-500",
  Partial: "bg-blue-500/10 text-blue-600 dark:text-blue-500",
  Unpaid: "bg-red-500/10 text-red-600 dark:text-red-500",
};

const ChildrenPage = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { user } = useAuth();
  const db = useDatabase();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [editChild, setEditChild] = useState<Child | null>(null);

  const [form, setForm] = useState({ 
    name: "", 
    group_name: "", 
    age: "", 
    parent_name: "", 
    phone: "", 
    payment_status: "Unpaid",
    fee_amount: 0,
    paid_amount: 0,
    discount_amount: 0,
    discount_percentage: 0
  });

  const { data: children = [], isLoading } = useQuery({
    queryKey: ["children"],
    queryFn: async () => {
      const { data, error } = await db.from<Child>("children").select("*").order("created_at", { ascending: false }) as { data: Child[] | null, error: any };
      if (error) throw error;
      return data || [];
    },
  });

  const calculateStatus = (paid: number, total: number, discount: number = 0) => {
    const required = total - discount;
    if (paid >= required && required > 0) return "Paid";
    if (paid > 0) return "Partial";
    return "Unpaid";
  };

  const upsertMutation = useMutation({
    mutationFn: async (child: Omit<Child, "id"> & { id?: string }) => {
      const status = calculateStatus(child.paid_amount || 0, child.fee_amount || 0, child.discount_amount || 0);
      const dataToSave = { ...child, payment_status: status };

      if (child.id) {
        // Log if amount paid increased
        const existing = children.find(c => c.id === child.id);
        const increase = (child.paid_amount || 0) - (existing?.paid_amount || 0);
        
        const { error } = await db.from("children").update(dataToSave).eq("id", child.id);
        if (error) throw error;

        if (increase > 0) {
          await db.from("transactions").insert({
            id: crypto.randomUUID(),
            type: 'income',
            description: `Payment - ${child.name}`,
            amount: increase,
            category: 'Tuition Fees',
            date: new Date().toISOString().slice(0, 10),
            created_by: user?.id
          });
        }
      } else {
        const id = crypto.randomUUID();
        const { error } = await db.from("children").insert({ ...dataToSave, id });
        if (error) throw error;

        if (child.paid_amount && child.paid_amount > 0) {
          await db.from("transactions").insert({
            id: crypto.randomUUID(),
            type: 'income',
            description: `Initial Payment - ${child.name}`,
            amount: child.paid_amount,
            category: 'Tuition Fees',
            date: new Date().toISOString().slice(0, 10),
            created_by: user?.id
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setDialogOpen(false);
      toast.success(t('children.save'));
      // Force reload as requested by user for "global update"
      setTimeout(() => window.location.reload(), 500);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const archiveYearMutation = useMutation({
    mutationFn: async () => {
      const [childrenRes, txRes, staffRes] = await Promise.all([
        (db.from<Child>("children").select("*") as unknown) as Promise<{ data: Child[] | null, error: any }>,
        (db.from<Transaction>("transactions").select("*") as unknown) as Promise<{ data: Transaction[] | null, error: any }>,
        (db.from<Staff>("staff").select("*") as unknown) as Promise<{ data: Staff[] | null, error: any }>
      ]);

      if (childrenRes.error) throw childrenRes.error;

      const childrenData = childrenRes.data || [];
      const txData = txRes.data || [];
      const staffData = staffRes.data || [];

      // Calculate annual KPIs for the snapshot
      const totalRev = txData.filter((t) => t.type === 'income').reduce((s: number, t) => s + Number(t.amount), 0);
      const totalSalaries = txData.filter((t) => t.type === 'expense' && t.category === 'Salaries').reduce((s: number, t) => s + Number(t.amount), 0);
      const totalOther = txData.filter((t) => t.type === 'expense' && t.category !== 'Salaries').reduce((s: number, t) => s + Number(t.amount), 0);

      const snapshot = {
        title: "Detailed Annual Audit",
        timestamp: new Date().toISOString(),
        children: childrenData,
        transactions: txData,
        staff: staffData,
        kpis: {
          totalRevenue: totalRev,
          totalSalaries: totalSalaries,
          otherExpenses: totalOther,
          totalExpenses: totalSalaries + totalOther,
          netProfit: totalRev - (totalSalaries + totalOther)
        }
      };

      const yearName = `Annual Audit - ${new Date().getFullYear()}`;
      await db.from<{ id: string; month_name: string; report_data: string }>("archive_reports").insert({
        id: crypto.randomUUID(),
        month_name: yearName,
        report_data: JSON.stringify(snapshot)
      });

      // Reset paid amounts for the new year
      await db.from("children").update({ 
        paid_amount: 0,
        payment_status: 'Unpaid'
      }).neq("id", "none");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      toast.success("Yearly data saved and reset successfully");
      setTimeout(() => window.location.reload(), 500);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (child: Child) => {
      const { error } = await db.from("children").delete().eq("id", child.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      toast.success("Child record deleted successfully");
      setTimeout(() => window.location.reload(), 500);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const handleSave = () => {
    if (!form.name || !form.parent_name) return toast.error("Name and Parent Name required");
    upsertMutation.mutate({
      ...(editChild?.id ? { id: editChild.id } : {}),
      name: form.name,
      group_name: form.group_name,
      age: form.age,
      parent_name: form.parent_name,
      phone: form.phone,
      payment_status: form.payment_status,
      fee_amount: form.fee_amount,
      paid_amount: form.paid_amount,
      discount_amount: form.discount_amount,
      discount_percentage: form.discount_percentage
    });
  };

  const updateFees = (fee: number) => {
    setForm(prev => ({ 
      ...prev, 
      fee_amount: fee,
    }));
  };

  const openEdit = (child: Child) => {
    setEditChild(child);
    setForm({ 
      name: child.name, 
      group_name: child.group_name || "", 
      age: child.age, 
      parent_name: child.parent_name, 
      phone: child.phone || "", 
      payment_status: child.payment_status,
      fee_amount: child.fee_amount || 0,
      paid_amount: child.paid_amount || 0,
      discount_amount: child.discount_amount || 0,
      discount_percentage: child.discount_percentage || 0
    });
    setDialogOpen(true);
  };

  const openAdd = () => {
    const defaultFee = Number(localStorage.getItem("defaultChildFee")) || 0;
    setEditChild(null);
    setForm({ 
      name: "", 
      group_name: "", 
      age: "", 
      parent_name: "", 
      phone: "", 
      payment_status: "Unpaid",
      fee_amount: defaultFee,
      paid_amount: 0,
      discount_amount: 0,
      discount_percentage: 0
    });
    setDialogOpen(true);
  };

  const filtered = children.filter(
    (child) =>
      child.name.toLowerCase().includes(search.toLowerCase()) ||
      child.parent_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalFees = children.reduce((s, c) => s + (c.fee_amount || 0), 0);
  const totalPaid = children.reduce((s, c) => s + (c.paid_amount || 0), 0);
  const totalDiscounts = children.reduce((s, c) => s + (c.discount_amount || 0), 0);
  const totalRemaining = totalFees - totalDiscounts - totalPaid;

  return (
    <AdminLayout>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-extrabold text-foreground tracking-tight mb-2 font-headline">{t('children.title')}</h2>
          <p className="text-foreground text-lg">{t('children.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
            <input
              className="w-full bg-card border border-sidebar-border rounded-full py-3 px-12 focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground placeholder:text-outline shadow-sm"
              placeholder={t('children.search')}
              value={search}
              maxLength={100}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { if (confirm("Save all current data for this year? This will archive records and reset paid amounts for the new year.")) archiveYearMutation.mutate(); }}
              disabled={archiveYearMutation.isPending}
              className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-bold text-xs hover:bg-indigo-200 transition-all"
            >
              <Archive size={14} />
              <span>{t('children.save_year_data')}</span>
            </button>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-bold hover:shadow-lg hover:shadow-primary/20 transition-all shrink-0">
            <Plus size={20} />
            <span>{t('children.add_child')}</span>
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <StatCard icon={<Users size={24} strokeWidth={2.5} />} label={t('children.total')} value={children.length} color="text-secondary" />
        <StatCard icon={<Receipt size={24} strokeWidth={2.5} />} label={t('children.table_fee')} value={`${totalFees.toLocaleString()} EGP`} color="text-primary" />
        <StatCard icon={<Percent size={24} strokeWidth={2.5} />} label="خصومات (Discounts)" value={`${totalDiscounts.toLocaleString()} EGP`} color="text-amber-600" />
        <StatCard icon={<TrendingUp size={24} strokeWidth={2.5} />} label={t('children.table_paid')} value={`${totalPaid.toLocaleString()} EGP`} color="text-green-700" />
        <StatCard icon={<Clock size={24} strokeWidth={2.5} />} label={t('children.table_remaining')} value={`${totalRemaining.toLocaleString()} EGP`} color="text-red-700" />
      </div>

      {/* Data Table Container */}
      <div className="bg-card rounded-[2rem] border border-surface-container-highest/20 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-foreground bg-surface-container-low">
            <Loader2 size={40} className="animate-spin mb-4" />
            <p className="animate-pulse">{t('children.loading')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary/5 text-foreground uppercase text-xs font-black tracking-widest">
                  <th className="px-8 py-5">{t('children.table_name')}</th>
                  <th className="px-8 py-5">{t('children.table_fee')}</th>
                  <th className="px-8 py-5">خصم (Discount)</th>
                  <th className="px-8 py-5">{t('children.table_paid')}</th>
                  <th className="px-8 py-5">{t('children.table_remaining')}</th>
                  <th className="px-8 py-5 text-center">{t('children.table_status')}</th>
                  <th className="px-8 py-5 text-right">{t('children.table_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sidebar-border/50">
                {filtered.map((child) => (
                  <tr key={child.id} className="hover:bg-surface-container-low/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary-container/40 flex items-center justify-center text-secondary font-bold font-headline">
                          {child.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-foreground">{child.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-bold">{child.fee_amount?.toLocaleString()} EGP</td>
                    <td className="px-8 py-6 text-amber-600 font-bold">{child.discount_amount?.toLocaleString() || 0} EGP</td>
                    <td className="px-8 py-6 text-emerald-600 font-bold">{child.paid_amount?.toLocaleString()} EGP</td>
                    <td className="px-8 py-6 text-red-600 font-bold">{((child.fee_amount || 0) - (child.discount_amount || 0) - (child.paid_amount || 0)).toLocaleString()} EGP</td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusStyles[child.payment_status || "Unpaid"]}`}>
                        {t(`children.status_${(child.payment_status || "Unpaid").toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(child)} className="w-8 h-8 rounded-full hover:bg-surface-container-low/80 flex items-center justify-center text-outline hover:text-primary transition-colors">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => { if (window.confirm("Delete record?")) deleteMutation.mutate(child); }} className="w-8 h-8 rounded-full hover:bg-destructive/10 flex items-center justify-center text-outline hover:text-destructive transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Child Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl font-black">{editChild ? t('children.edit_title') : t('children.add_title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
            {/* Section 1: Personal Profile */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <User size={14} />
                البيانات الشخصية (Personal)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-sm font-bold text-foreground">{t('children.field_name')}</label>
                  <input
                    className="w-full bg-surface-container-low border-2 border-primary/20 rounded-xl py-3 px-4 text-foreground focus:ring-4 focus:ring-primary/20 transition-all font-bold"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-foreground">{t('children.field_age')}</label>
                  <input
                    className="w-full bg-surface-container-low border-2 border-primary/20 rounded-xl py-3 px-4 text-foreground focus:ring-4 focus:ring-primary/20 transition-all font-medium"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-foreground">{t('children.field_group')}</label>
                  <input
                    className="w-full bg-surface-container-low border-2 border-primary/20 rounded-xl py-3 px-4 text-foreground focus:ring-4 focus:ring-primary/20 transition-all font-medium"
                    value={form.group_name}
                    onChange={(e) => setForm({ ...form, group_name: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-surface-container-low/80-highest/20 mx-2" />

            {/* Section 2: Contact Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Phone size={14} />
                بيانات التواصل (Contact)
              </h4>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-foreground">{t('children.field_parent')}</label>
                  <input
                    className="w-full bg-surface-container-low border-2 border-primary/20 rounded-xl py-3 px-4 text-foreground focus:ring-4 focus:ring-primary/20 transition-all font-bold"
                    value={form.parent_name}
                    onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-foreground">{t('children.field_phone')}</label>
                  <input
                    className="w-full bg-surface-container-low border-2 border-primary/20 rounded-xl py-3 px-4 text-foreground focus:ring-4 focus:ring-primary/20 transition-all font-mono"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-surface-container-low/80-highest/20 mx-2" />

            {/* Section 3: Financial Records */}
            <div className="space-y-4 bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Banknote size={14} />
                السجل المالي (Financials)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-foreground">{t('children.table_fee')}</label>
                  <input
                    className="w-full bg-surface-container-low border-2 border-primary/20 rounded-xl py-3 px-4 text-foreground focus:ring-4 focus:ring-primary/20 font-black text-lg"
                    type="number"
                    value={form.fee_amount}
                    onChange={(e) => updateFees(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-orange-600">Discount (خصم)</label>
                  <input
                    className="w-full bg-orange-50 border-2 border-orange-100 rounded-xl py-3 px-4 text-orange-700 focus:ring-4 focus:ring-orange-200 font-black text-lg"
                    type="number"
                    value={form.discount_amount}
                    onChange={(e) => setForm({ ...form, discount_amount: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-sm font-bold text-emerald-700">{t('children.table_paid')}</label>
                  <input
                    className="w-full bg-emerald-50 border-2 border-emerald-100 rounded-xl py-3 px-4 text-emerald-700 focus:ring-4 focus:ring-emerald-200 font-black text-lg"
                    type="number"
                    value={form.paid_amount}
                    onChange={(e) => setForm({ ...form, paid_amount: Number(e.target.value) })}
                  />
                </div>
                <div className="col-span-2 bg-surface-container-low/50 p-3 rounded-xl flex justify-between items-center border border-dashed border-primary/20">
                    <label className="text-sm font-bold text-foreground flex justify-between w-full">
                    <span>{t('children.table_remaining')}</span>
                    <span className={`text-xl font-black ${((form.fee_amount || 0) - (form.discount_amount || 0) - (form.paid_amount || 0)) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {((form.fee_amount || 0) - (form.discount_amount || 0) - (form.paid_amount || 0)).toLocaleString()} EGP
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={upsertMutation.isPending}
              className="w-full bg-primary text-white py-4 rounded-full font-black text-lg hover:shadow-xl hover:shadow-primary/20 transition-all mt-4 disabled:opacity-60"
            >
              {upsertMutation.isPending ? (
                <div className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    {t('children.saving')}
                </div>
              ) : t('children.save')}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

const StatCard = ({ icon, label, value, color }: StatCardProps) => (
  <motion.div 
    whileHover={{ y: -3, scale: 1.01 }}
    transition={{ duration: 0.2 }}
    className="p-5 rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 bg-card"
  >
    <div className={`w-10 h-10 rounded-xl bg-muted/50 border border-border/60 flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-xl font-bold text-foreground font-headline truncate">{value}</div>
      <div className="text-muted-foreground font-semibold text-[11px] uppercase tracking-wider truncate mt-0.5">{label}</div>
    </div>
  </motion.div>
);

export default ChildrenPage;
