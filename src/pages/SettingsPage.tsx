import { useState, useEffect } from "react";
import {
  Database,
  Sliders,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  Wallet,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Sparkles,
  CheckCircle2,
  Save,
} from "lucide-react";
import { seedData } from "@/lib/seeding";
import { useAuth } from "@/hooks/useAuth";
import { useAppMode } from "@/hooks/useAppMode";
import AdminLayout from "@/components/AdminLayout";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useDatabase } from "@/hooks/useDatabase";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Child, Transaction, Staff } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { stagger, rise } from "@/lib/motion";

type ResetAction = "monthly" | "financials" | "full" | null;

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const db = useDatabase();
  const { mode } = useAppMode();
  const isRtl = i18n.language === "ar";

  const [config, setConfig] = useState({ defaultChildFee: "", defaultStaffSalary: "", defaultDueDate: "" });
  const [confirmAction, setConfirmAction] = useState<ResetAction>(null);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    setConfig({
      defaultChildFee: localStorage.getItem("defaultChildFee") || "",
      defaultStaffSalary: localStorage.getItem("defaultStaffSalary") || "",
      defaultDueDate: localStorage.getItem("defaultDueDate") || "",
    });
  }, []);

  const seedMutation = useMutation({
    mutationFn: () => seedData(db, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success(isRtl ? "تم توليد البيانات التجريبية بنجاح!" : "Database seeded with demo data successfully!");
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const updateConfig = (key: string, val: string) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
    localStorage.setItem(key, val);
  };

  const clearConfig = () => {
    localStorage.removeItem("defaultChildFee");
    localStorage.removeItem("defaultStaffSalary");
    localStorage.removeItem("defaultDueDate");
    setConfig({ defaultChildFee: "", defaultStaffSalary: "", defaultDueDate: "" });
    toast.success(isRtl ? "تمت استعادة الإعدادات الافتراضية" : "Default configurations restored");
  };

  const actionTitles: Record<string, { title: string; desc: string }> = {
    monthly: { title: t("settings_page.monthly_title"), desc: t("settings_page.monthly_desc") },
    financials: { title: t("settings_page.finance_title"), desc: t("settings_page.finance_desc") },
    full: { title: t("settings_page.full_title"), desc: t("settings_page.full_desc") },
  };

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (confirmText !== "YES") throw new Error("Please type YES exactly.");

      if (confirmAction === "monthly") {
        const [childrenRes, txRes, staffRes] = await Promise.all([
          db.from<Child>("children").select("*"),
          db.from<Transaction>("transactions").select("*"),
          db.from<Staff>("staff").select("*"),
        ]);

        const childrenRecords = childrenRes.data || [];
        const txRecords = txRes.data || [];
        const staffRecords = staffRes.data || [];

        const totalRevenue = txRecords.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
        const totalExpenses = txRecords.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
        const totalFeesRequired = childrenRecords.reduce((sum, c) => sum + Number(c.fee_amount || 0), 0);
        const totalDiscounts = childrenRecords.reduce((sum, c) => sum + Number(c.discount_amount || 0), 0);
        const totalFeesPaid = childrenRecords.reduce((sum, c) => sum + Number(c.paid_amount || 0), 0);

        const snapshot = {
          title: "Monthly Operational Audit",
          kpis: {
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
            totalFeesRequired,
            totalDiscounts,
            totalFeesPaid,
            remainingDue: Math.max(0, totalFeesRequired - totalDiscounts - totalFeesPaid),
          },
          counts: {
            children: childrenRecords.length,
            staff: staffRecords.length,
            transactions: txRecords.length,
          },
          childrenSummary: childrenRecords.map((c) => ({
            id: c.id,
            name: c.name,
            fee: c.fee_amount,
            paid: c.paid_amount,
            discount: c.discount_amount,
            balance: Math.max(0, (c.fee_amount || 0) - (c.discount_amount || 0) - (c.paid_amount || 0)),
          })),
          staffSummary: staffRecords.map((s) => ({
            id: s.id,
            name: s.name,
            role: s.role,
            salary: s.salary,
            paidSalary: s.paid_salary,
            advanceTaken: s.advance_taken,
          })),
        };

        const now = new Date();
        const monthName = now.toLocaleString("default", { month: "long", year: "numeric" });

        await db.from("archive_reports").insert([
          {
            id: crypto.randomUUID(),
            month_name: monthName,
            report_data: snapshot,
            created_at: now.toISOString(),
          },
        ]);

        await Promise.all(
          childrenRecords.map((c) =>
            db.from<Child>("children").update({ paid_amount: 0 }).eq("id", c.id)
          )
        );

        await Promise.all(
          staffRecords.map((s) =>
            db.from<Staff>("staff").update({ paid_salary: 0, advance_taken: 0 }).eq("id", s.id)
          )
        );
      } else if (confirmAction === "financials") {
        await db.from<Transaction>("transactions").delete().neq("id", "none");
        const [cRes, sRes] = await Promise.all([
          db.from<Child>("children").select("id"),
          db.from<Staff>("staff").select("id"),
        ]);
        if (cRes.data) {
          await Promise.all(
            cRes.data.map((c) => db.from<Child>("children").update({ paid_amount: 0 }).eq("id", c.id))
          );
        }
        if (sRes.data) {
          await Promise.all(
            sRes.data.map((s) =>
              db.from<Staff>("staff").update({ paid_salary: 0, advance_taken: 0 }).eq("id", s.id)
            )
          );
        }
      } else if (confirmAction === "full") {
        await db.from<Transaction>("transactions").delete().neq("id", "none");
        await db.from<Staff>("staff").delete().neq("id", "none");
        await db.from<Child>("children").delete().neq("id", "none");
        await db.from("archive_reports").delete().neq("id", "none");
      }
    },
    onSuccess: () => {
      toast.success(isRtl ? "تم تنفيذ الإجراء بنجاح." : "Action executed successfully.");
      setConfirmAction(null);
      setConfirmText("");
      queryClient.invalidateQueries();
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  return (
    <AdminLayout>
      <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-8">
        {/* Animated Header */}
        <motion.header variants={rise} className="pb-4 border-b border-border/40 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground font-headline">
                {t("settings_page.title")}
              </h1>
              <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Sparkles size={12} className="animate-pulse" /> Preferences
              </span>
            </div>
            <p className="text-muted-foreground font-medium text-sm md:text-base mt-1.5">
              {t("settings_page.subtitle")}
            </p>
          </div>
        </motion.header>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* 1. Default Operational Configurations */}
          <motion.div
            variants={rise}
            whileHover={{ y: -3, scale: 1.005 }}
            transition={{ duration: 0.2 }}
            className="bg-card dark:bg-[#0c0e18]/85 backdrop-blur-md rounded-2xl border border-border/60 shadow-sm overflow-hidden flex flex-col group"
          >
            <div className="bg-primary/5 dark:bg-primary/10 p-5 px-6 flex items-center gap-3.5 border-b border-border/40">
              <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 shadow-sm">
                <Sliders size={20} />
              </div>
              <div>
                <h3 className="font-bold font-headline text-base text-foreground">
                  {t("settings_page.config_title")}
                </h3>
                <p className="text-muted-foreground text-xs">{t("settings_page.config_desc")}</p>
              </div>
            </div>

            <div className="p-6 space-y-4 flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  {t("settings_page.fee_label")}
                </label>
                <input
                  className="w-full bg-muted/50 dark:bg-white/[0.05] border border-border/70 focus:border-primary rounded-xl py-2.5 px-3.5 text-foreground focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-sm outline-none"
                  type="number"
                  placeholder="0"
                  value={config.defaultChildFee}
                  onChange={(e) => updateConfig("defaultChildFee", e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">{t("settings_page.fee_desc")}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  {t("settings_page.salary_label")}
                </label>
                <input
                  className="w-full bg-muted/50 dark:bg-white/[0.05] border border-border/70 focus:border-primary rounded-xl py-2.5 px-3.5 text-foreground focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-sm outline-none"
                  type="number"
                  placeholder="0"
                  value={config.defaultStaffSalary}
                  onChange={(e) => updateConfig("defaultStaffSalary", e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">{t("settings_page.salary_desc")}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  {t("settings_page.date_label")}
                </label>
                <input
                  className="w-full bg-muted/50 dark:bg-white/[0.05] border border-border/70 focus:border-primary rounded-xl py-2.5 px-3.5 text-foreground focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-sm outline-none"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="5"
                  value={config.defaultDueDate}
                  onChange={(e) => updateConfig("defaultDueDate", e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">{t("settings_page.date_desc")}</p>
              </div>
            </div>

            <div className="p-4 px-6 bg-muted/20 dark:bg-white/[0.02] border-t border-border/40 flex items-center justify-between">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ rotate: -180, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                onClick={clearConfig}
                className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>{t("settings_page.restore_btn")}</span>
              </motion.button>
              <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} /> Auto-Saved
              </span>
            </div>
          </motion.div>

          {/* 2. Demo Data & Seeding Tools */}
          <motion.div
            variants={rise}
            whileHover={{ y: -3, scale: 1.005 }}
            transition={{ duration: 0.2 }}
            className="bg-card dark:bg-[#0c0e18]/85 backdrop-blur-md rounded-2xl border border-border/60 shadow-sm overflow-hidden flex flex-col group"
          >
            <div className="bg-emerald-500/10 p-5 px-6 flex items-center gap-3.5 border-b border-border/40">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
                <Database size={20} />
              </div>
              <div>
                <h3 className="font-bold font-headline text-base text-foreground">
                  {isRtl ? "بيانات الاختبار السريعة" : "Demo Data & Sandbox"}
                </h3>
                <p className="text-muted-foreground text-xs">
                  {isRtl ? "توليد سجلات كاملة لتجربة المنصة" : "Generate sample children and transactions"}
                </p>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-muted/40 dark:bg-white/[0.03] border border-border/50 text-xs text-muted-foreground space-y-2">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    {isRtl ? "حزمة البيانات التجريبية تشمل:" : "Included Test Dataset:"}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px]">
                    <li>{isRtl ? "50 طفلاً مسجلين بحالات دفع مختلفة" : "50 enrolled children with payment records"}</li>
                    <li>{isRtl ? "25 موظفاً مع رواتب وسلف" : "25 staff members with salaries & payroll"}</li>
                    <li>{isRtl ? "معاملات وإيرادات شهرية للرسوم البيانية" : "Full revenue & expense transactions"}</li>
                  </ul>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (confirm(isRtl ? "هل تريد حقاً توليد البيانات التجريبية؟" : "DANGER: Seed demo data?")) {
                    seedMutation.mutate();
                  }
                }}
                disabled={seedMutation.isPending}
                className="w-full flex items-center justify-center gap-2 p-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {seedMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{isRtl ? "جارٍ التوليد..." : "Seeding Data..."}</span>
                  </>
                ) : (
                  <>
                    <Database size={16} />
                    <span>{isRtl ? "توليد بيانات تجريبية كاملة" : "Seed Demo Sandbox"}</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* 3. Danger Zone Section */}
          <motion.div
            variants={rise}
            whileHover={{ y: -3, scale: 1.005 }}
            transition={{ duration: 0.2 }}
            className="bg-card dark:bg-[#0c0e18]/85 backdrop-blur-md rounded-2xl border border-destructive/30 shadow-sm overflow-hidden flex flex-col group hover:shadow-destructive/5 hover:border-destructive/50 transition-all"
          >
            <div className="bg-destructive/10 p-5 px-6 flex items-center gap-3.5 border-b border-destructive/20">
              <div className="w-10 h-10 rounded-xl bg-destructive/20 text-destructive flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold font-headline text-base text-destructive">
                  {t("settings_page.danger_title")}
                </h3>
                <p className="text-muted-foreground text-xs">{t("settings_page.danger_desc")}</p>
              </div>
            </div>

            <div className="p-6 space-y-3.5 flex-1">
              {/* Monthly Audit Reset */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-destructive text-xs truncate">
                    {t("settings_page.monthly_title")}
                  </h4>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    {t("settings_page.monthly_desc")}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setConfirmAction("monthly")}
                  className="shrink-0 p-2 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive hover:text-white transition-all cursor-pointer"
                  title="Monthly Reset"
                >
                  <RotateCcw size={15} />
                </motion.button>
              </motion.div>

              {/* Financials Reset */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-destructive text-xs truncate">
                    {t("settings_page.finance_title")}
                  </h4>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    {t("settings_page.finance_desc")}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setConfirmAction("financials")}
                  className="shrink-0 p-2 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive hover:text-white transition-all cursor-pointer"
                  title="Reset Financials"
                >
                  <Wallet size={15} />
                </motion.button>
              </motion.div>

              {/* Full System Wipe */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="flex items-center justify-between gap-3 p-3.5 rounded-xl border-2 border-dashed border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-destructive text-xs uppercase italic truncate">
                    {t("settings_page.full_title")}
                  </h4>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    {t("settings_page.full_desc")}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setConfirmAction("full")}
                  className="shrink-0 p-2 rounded-lg bg-destructive text-white shadow-md shadow-destructive/30 hover:opacity-90 transition-all cursor-pointer"
                  title="Complete Reset"
                >
                  <Trash2 size={16} />
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Animated Confirmation Modal */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border-destructive/30 shadow-2xl bg-card dark:bg-[#0c0e18] text-foreground">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl font-black text-destructive flex items-center gap-2">
              <ShieldAlert size={22} />
              {t("settings_page.confirm_title")}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground font-medium pt-1">
              {confirmAction && actionTitles[confirmAction].desc}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="bg-destructive/10 p-3.5 rounded-xl border border-destructive/20 text-destructive text-xs font-bold text-center uppercase tracking-widest">
              {confirmAction && actionTitles[confirmAction].title}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">
                {t("settings_page.confirm_prompt")}
              </label>
              <input
                className="w-full bg-muted/60 dark:bg-white/[0.05] border border-destructive/40 focus:border-destructive rounded-xl py-3 px-4 text-foreground focus:ring-2 focus:ring-destructive/20 transition-all font-black text-center tracking-[0.25em] outline-none text-base"
                placeholder="YES"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending || confirmText !== "YES"}
              className="w-full bg-destructive text-white py-3.5 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-destructive/30 transition-all mt-4 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {resetMutation.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
              {resetMutation.isPending ? t("settings_page.confirm_executing") : t("settings_page.confirm_execute")}
            </motion.button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default SettingsPage;
