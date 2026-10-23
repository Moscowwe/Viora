import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { useDatabase } from "@/hooks/useDatabase";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";
import ProfileDropdown from "@/components/ProfileDropdown";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import { AlertCircle, RefreshCcw, ChevronRight, ChevronLeft, ArrowUpRight, ArrowDownLeft, Sparkles, TrendingUp, Users, CreditCard, ShieldCheck, BarChart3, LineChart } from "lucide-react";
import { Child, Transaction } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { CountUp, EASE, stagger, rise, slideRow } from "@/lib/motion";

const CURRENCY = "EGP";
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

const AnimatedMoney = ({ value, signed = false, className = "", large = false }: { value: number; signed?: boolean; className?: string; large?: boolean }) => {
  const sign = signed ? (value > 0 ? "+" : value < 0 ? "−" : "") : value < 0 ? "−" : "";
  return (
    <span className={`figures whitespace-nowrap inline-flex items-baseline font-bold tracking-tight ${className}`} dir="ltr">
      {sign}
      <CountUp value={Math.abs(value)} duration={1.2} />
      <span className={`ms-1.5 font-medium text-muted-foreground align-baseline ${large ? "text-sm" : "text-xs"}`}>{CURRENCY}</span>
    </span>
  );
};

const remainingFor = (c: Child) =>
  Math.max((Number(c.fee_amount) || 0) - (Number(c.discount_amount) || 0) - (Number(c.paid_amount) || 0), 0);

const DashboardPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const db = useDatabase();
  const isRtl = i18n.language === "ar";
  const [chartType, setChartType] = useState<"bar" | "area">("bar");
  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  const { data: children = [], isLoading: childrenLoading, error: childrenError, refetch: refetchChildren } = useQuery({
    queryKey: ["children"],
    queryFn: async () => {
      const { data, error } = (await db.from<Child>("children").select("*")) as { data: Child[] | null; error: any };
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: transactions = [], isLoading: txLoading, error: txError, refetch: refetchTx } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = (await db
        .from<Transaction>("transactions")
        .select("*")
        .order("date", { ascending: false })) as { data: Transaction[] | null; error: any };
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const isLoading = childrenLoading || txLoading;
  const hasError = childrenError || txError;

  const handleRefresh = () => {
    refetchChildren();
    refetchTx();
  };

  if (hasError) {
    return (
      <AdminLayout>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="flex flex-col items-center justify-center max-w-lg py-24 mx-auto text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4 shadow-inner">
            <AlertCircle size={28} strokeWidth={2} />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">{t("admin.error_title")}</h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{t("admin.error_desc")}</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleRefresh}
            className="press focus-ring h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
          >
            <RefreshCcw size={15} />
            {t("admin.error_refresh")}
          </motion.button>
          {process.env.NODE_ENV === "development" && (
            <pre className="mt-6 p-4 w-full rounded-xl border border-border/60 bg-muted/40 text-xs text-muted-foreground overflow-auto text-start">
              {String(childrenError || txError)}
            </pre>
          )}
        </motion.div>
      </AdminLayout>
    );
  }

  // ---- Calculations ----
  const totalIncome = transactions.filter((x) => x.type === "income").reduce((s, x) => s + Number(x.amount), 0);
  const totalSalaries = transactions
    .filter((x) => x.type === "expense" && x.category === "Salaries")
    .reduce((s, x) => s + Number(x.amount), 0);
  const otherExpenses = transactions
    .filter((x) => x.type === "expense" && x.category !== "Salaries")
    .reduce((s, x) => s + Number(x.amount), 0);
  const totalExpenses = totalSalaries + otherExpenses;
  const net = totalIncome - totalExpenses;
  const totalDiscounts = children.reduce((s, c) => s + Number(c.discount_amount || 0), 0);

  const owing = children
    .map((c) => ({ child: c, remaining: remainingFor(c) }))
    .filter((r) => r.remaining > 0)
    .sort((a, b) => b.remaining - a.remaining);
  const totalOwed = owing.reduce((s, r) => s + r.remaining, 0);
  const billable = children.filter((c) => (Number(c.fee_amount) || 0) > 0);
  const paidInFull = billable.filter((c) => remainingFor(c) === 0).length;
  const partialCount = owing.filter((r) => (Number(r.child.paid_amount) || 0) > 0).length;
  const unpaidCount = owing.length - partialCount;

  // Monthly series
  const byMonth: Record<string, { income: number; expenses: number }> = {};
  transactions.forEach((x) => {
    const key = String(x.date).slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(key)) return;
    byMonth[key] ??= { income: 0, expenses: 0 };
    if (x.type === "income") byMonth[key].income += Number(x.amount);
    else byMonth[key].expenses += Number(x.amount);
  });
  const chartData = Object.keys(byMonth)
    .sort()
    .slice(-6)
    .map((key) => {
      const [y, m] = key.split("-").map(Number);
      return {
        month: new Date(y, m - 1, 1).toLocaleString(isRtl ? "ar-EG" : "en-US", { month: "short" }),
        ...byMonth[key],
      };
    });

  const recentTx = transactions.slice(0, 5);
  const owingTop = owing.slice(0, 5);

  const statusRows = [
    { label: t("children.status_paid"), value: paidInFull, color: "bg-emerald-500", text: "text-emerald-500" },
    { label: t("children.status_partial"), value: partialCount, color: "bg-amber-500", text: "text-amber-500" },
    { label: t("children.status_unpaid"), value: unpaidCount, color: "bg-rose-500", text: "text-rose-500" },
  ];
  const statusMax = Math.max(1, ...statusRows.map((r) => r.value));

  const finding =
    children.length === 0
      ? t("admin.finding_empty")
      : owing.length === 0
        ? t("admin.finding_clear")
        : t("admin.finding_owed", { count: owing.length, amount: `${fmt(totalOwed)} ${CURRENCY}` });

  return (
    <AdminLayout>
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <motion.div 
          variants={stagger}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-6"
        >
          {/* Header Title with smooth spring entrance */}
          <motion.header 
            variants={rise}
            className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border/40"
          >
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold font-headline tracking-tight text-foreground">
                  {t("admin.overview")}
                </h1>
                <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  <Sparkles size={12} className="animate-pulse" /> Live
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                {finding}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/admin/children")}
                className="press focus-ring h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 transition-all"
              >
                <CreditCard size={16} />
                {t("admin.record_payment")}
              </motion.button>
              <ProfileDropdown />
            </div>
          </motion.header>

          {/* KPI Strip with subtle glow & live counter animations */}
          <motion.section
            variants={rise}
            aria-label="Key figures"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <KpiCard
              label={t("admin.still_owed")}
              icon={<Users size={18} className="text-amber-500" />}
              iconBg="bg-amber-500/10 border-amber-500/20"
              value={<AnimatedMoney value={totalOwed} large />}
              sub={t("admin.discounts_given", { amount: `${fmt(totalDiscounts)} ${CURRENCY}` })}
              gradient="from-amber-500/5 to-transparent"
            />
            <KpiCard
              label={t("admin.collected")}
              icon={<TrendingUp size={18} className="text-emerald-500" />}
              iconBg="bg-emerald-500/10 border-emerald-500/20"
              value={<AnimatedMoney value={totalIncome} large />}
              sub={t("admin.paid_in_full", { paid: paidInFull, total: billable.length })}
              gradient="from-emerald-500/5 to-transparent"
            />
            <KpiCard
              label={t("admin.expenses")}
              icon={<ArrowDownLeft size={18} className="text-rose-500" />}
              iconBg="bg-rose-500/10 border-rose-500/20"
              value={<AnimatedMoney value={totalExpenses} large />}
              sub={t("admin.expenses_split", { salaries: fmt(totalSalaries), other: fmt(otherExpenses) })}
              gradient="from-rose-500/5 to-transparent"
            />
            <KpiCard
              label={t("admin.net_profit")}
              icon={<ShieldCheck size={18} className="text-primary" />}
              iconBg="bg-primary/10 border-primary/20"
              value={<AnimatedMoney value={net} className={net < 0 ? "text-destructive" : "text-foreground"} large />}
              sub={t("admin.net_caption")}
              gradient="from-primary/5 to-transparent"
            />
          </motion.section>

          {/* Row 2: Charts and Who owes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div variants={rise} className="lg:col-span-2">
              <Panel
                title={t("admin.financial_performance")}
                right={
                  <div className="flex flex-wrap items-center gap-3">
                    {/* View Switcher: Bar vs Area Wave with animated spring indicator */}
                    <div className="flex items-center p-1 rounded-xl bg-muted/60 dark:bg-white/[0.05] border border-border/60">
                      <button
                        onClick={() => setChartType("bar")}
                        className={`relative px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                          chartType === "bar" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {chartType === "bar" && (
                          <motion.div
                            layoutId="financial-chart-toggle"
                            className="absolute inset-0 bg-card rounded-lg shadow-sm border border-border/60"
                            transition={{ type: "spring", stiffness: 450, damping: 35 }}
                          />
                        )}
                        <BarChart3 size={13} className="relative z-10" />
                        <span className="relative z-10">{isRtl ? "أعمدة" : "Bars"}</span>
                      </button>
                      <button
                        onClick={() => setChartType("area")}
                        className={`relative px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                          chartType === "area" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {chartType === "area" && (
                          <motion.div
                            layoutId="financial-chart-toggle"
                            className="absolute inset-0 bg-card rounded-lg shadow-sm border border-border/60"
                            transition={{ type: "spring", stiffness: 450, damping: 35 }}
                          />
                        )}
                        <LineChart size={13} className="relative z-10" />
                        <span className="relative z-10">{isRtl ? "انسيابي" : "Wave"}</span>
                      </button>
                    </div>

                    {/* Chart Legends with live indicator */}
                    <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-tr from-primary to-[#be123c] shadow-sm animate-pulse" />
                        {t("admin.income")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/40 shadow-sm" />
                        {t("admin.expenses")}
                      </span>
                    </div>
                  </div>
                }
              >
                {chartData.length > 0 ? (
                  <div className="h-[270px] -ms-2 pt-2 relative" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === "bar" ? (
                        <BarChart data={chartData} barGap={6} barCategoryGap="24%">
                          <defs>
                            <linearGradient id="incomeBarGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#9e002b" stopOpacity={1} />
                              <stop offset="100%" stopColor="#800020" stopOpacity={0.8} />
                            </linearGradient>
                            <linearGradient id="expenseBarGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#64748b" stopOpacity={0.7} />
                              <stop offset="100%" stopColor="#334155" stopOpacity={0.3} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" />
                          <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            width={56}
                            tickCount={5}
                            tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                          />
                          <Tooltip
                            cursor={{ fill: "hsl(var(--surface-container) / 0.5)" }}
                            formatter={(v: number, name: string) => [
                              `${fmt(v)} ${CURRENCY}`,
                              name === "income" ? t("admin.income") : t("admin.expenses"),
                            ]}
                            contentStyle={{
                              borderRadius: 12,
                              border: "1px solid hsl(var(--border))",
                              background: "hsl(var(--card))",
                              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)",
                              fontSize: 12,
                              padding: "8px 12px",
                            }}
                            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 700, marginBottom: 4 }}
                          />
                          <Bar 
                            dataKey="income" 
                            fill="url(#incomeBarGradient)" 
                            radius={[6, 6, 0, 0]} 
                            maxBarSize={32}
                            animationDuration={1500}
                            animationEasing="ease-out"
                          />
                          <Bar 
                            dataKey="expenses" 
                            fill="url(#expenseBarGradient)" 
                            radius={[6, 6, 0, 0]} 
                            maxBarSize={32}
                            animationDuration={1500}
                            animationEasing="ease-out"
                          />
                        </BarChart>
                      ) : (
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="incomeAreaGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#800020" stopOpacity={0.6} />
                              <stop offset="95%" stopColor="#800020" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="expenseAreaGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#64748b" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" />
                          <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            width={56}
                            tickCount={5}
                            tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                          />
                          <Tooltip
                            formatter={(v: number, name: string) => [
                              `${fmt(v)} ${CURRENCY}`,
                              name === "income" ? t("admin.income") : t("admin.expenses"),
                            ]}
                            contentStyle={{
                              borderRadius: 12,
                              border: "1px solid hsl(var(--border))",
                              background: "hsl(var(--card))",
                              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)",
                              fontSize: 12,
                              padding: "8px 12px",
                            }}
                            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 700, marginBottom: 4 }}
                          />
                          <Area
                            type="monotone"
                            dataKey="income"
                            stroke="#800020"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#incomeAreaGradient)"
                            animationDuration={1500}
                            animationEasing="ease-out"
                          />
                          <Area
                            type="monotone"
                            dataKey="expenses"
                            stroke="#64748b"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            fillOpacity={1}
                            fill="url(#expenseAreaGradient)"
                            animationDuration={1500}
                            animationEasing="ease-out"
                          />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState message={t("admin.no_transactions")} />
                )}
              </Panel>
            </motion.div>

            <motion.div variants={rise}>
              <Panel
                title={t("admin.who_owes")}
                right={
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 figures">
                    {owing.length}
                  </span>
                }
                footer={
                  owing.length > 0 && (
                    <motion.button
                      whileHover={{ x: isRtl ? -4 : 4 }}
                      onClick={() => navigate("/admin/children")}
                      className="press focus-ring inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      {t("admin.view_all")}
                      <Chevron size={14} />
                    </motion.button>
                  )
                }
              >
                {owingTop.length > 0 ? (
                  <ul className="flex flex-col gap-1 -mx-1">
                    {owingTop.map(({ child, remaining }, idx) => (
                      <motion.li 
                        key={child.id}
                        variants={slideRow(isRtl)}
                        custom={idx}
                      >
                        <button
                          onClick={() => navigate("/admin/children")}
                          className="row-hover focus-ring w-full flex items-center gap-3 p-2.5 rounded-xl text-start transition-all hover:bg-surface-container/70"
                        >
                          <InitialAvatar name={child.name} />
                          <div className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-foreground truncate">{child.name}</span>
                            <span className="block text-xs text-muted-foreground truncate">
                              {child.group_name || "—"}
                            </span>
                          </div>
                          <AnimatedMoney value={remaining} className="text-sm font-bold text-amber-600 dark:text-amber-400" />
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState message={t("admin.all_paid_up")} />
                )}
              </Panel>
            </motion.div>
          </div>

          {/* Row 3: Transactions & Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div variants={rise} className="lg:col-span-2">
              <Panel
                title={t("admin.recent_transactions")}
                footer={
                  transactions.length > 0 && (
                    <motion.button
                      whileHover={{ x: isRtl ? -4 : 4 }}
                      onClick={() => navigate("/admin/finance")}
                      className="press focus-ring inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      {t("admin.view_all")}
                      <Chevron size={14} />
                    </motion.button>
                  )
                }
              >
                {recentTx.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs font-semibold text-muted-foreground border-b border-border/60">
                          <th className="text-start pb-2.5 w-32">{t("admin.col_date")}</th>
                          <th className="text-start pb-2.5">{t("admin.col_description")}</th>
                          <th className="text-end pb-2.5">{t("admin.col_amount")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {recentTx.map((x) => {
                          const isIncome = x.type === "income";
                          return (
                            <tr key={x.id} className="row-hover transition-colors group">
                              <td className="py-3 text-xs text-muted-foreground figures whitespace-nowrap" dir="ltr">
                                {x.date}
                              </td>
                              <td className="py-3 text-foreground font-medium">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                    isIncome ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                  }`}>
                                    {isIncome ? <ArrowDownLeft size={14} strokeWidth={2.5} /> : <ArrowUpRight size={14} strokeWidth={2.5} />}
                                  </div>
                                  <span className="truncate max-w-[20rem]">{x.description}</span>
                                </div>
                              </td>
                              <td className="py-3 text-end font-semibold">
                                <AnimatedMoney value={isIncome ? Number(x.amount) : -Number(x.amount)} signed className={isIncome ? "text-emerald-500" : "text-rose-500"} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState message={t("admin.no_transactions")} />
                )}
              </Panel>
            </motion.div>

            <motion.div variants={rise}>
              <Panel
                title={t("sidebar.payment_ratio")}
                right={
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 figures">
                    {billable.length} {t("sidebar.children")}
                  </span>
                }
                footer={
                  <motion.button
                    whileHover={{ x: isRtl ? -4 : 4 }}
                    onClick={() => navigate("/admin/children")}
                    className="press focus-ring inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    {t("sidebar.children")}
                    <Chevron size={14} />
                  </motion.button>
                }
              >
                <div className="flex flex-col gap-5 py-1">
                  {statusRows.map((r, i) => (
                    <div key={r.label} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${r.color}`} />
                          {r.label}
                        </span>
                        <span className="figures font-bold text-foreground">
                          {r.value} <span className="text-[10px] text-muted-foreground font-normal">({Math.round((r.value / (billable.length || 1)) * 100)}%)</span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/60 overflow-hidden p-0.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(r.value / statusMax) * 100}%` }}
                          transition={{ duration: 1, ease: EASE, delay: 0.2 + i * 0.1 }}
                          className={`h-full rounded-full ${r.color} shadow-sm`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AdminLayout>
  );
};

/* ---------- Card & UI Elements with Rich Micro-Interactions ---------- */

const KpiCard = ({
  label,
  icon,
  iconBg,
  value,
  sub,
  gradient,
}: {
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  value: React.ReactNode;
  sub?: string;
  gradient: string;
}) => (
  <motion.div
    whileHover={{ y: -3, scale: 1.01 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className={`relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br ${gradient}`}
  >
    <div className="flex items-center justify-between gap-2 mb-3">
      <span className="text-xs font-semibold text-muted-foreground truncate uppercase tracking-wider">{label}</span>
      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${iconBg} shadow-sm`}>
        {icon}
      </div>
    </div>
    <div className="mt-1 text-2xl md:text-3xl font-extrabold text-foreground truncate">
      {value}
    </div>
    {sub && <p className="text-xs text-muted-foreground mt-2 truncate font-medium">{sub}</p>}
  </motion.div>
);

const Panel = ({
  title,
  right,
  footer,
  children,
  className = "",
}: {
  title: string;
  right?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.section
    whileHover={{ borderColor: "hsl(var(--primary) / 0.3)" }}
    transition={{ duration: 0.2 }}
    className={`rounded-2xl border border-border/80 bg-card p-6 flex flex-col shadow-sm transition-colors ${className}`}
  >
    <header className="flex items-center justify-between gap-3 mb-5">
      <h2 className="text-base font-bold font-headline text-foreground">{title}</h2>
      {right}
    </header>
    <div className="flex-1 min-h-0">{children}</div>
    {footer && <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-end">{footer}</div>}
  </motion.section>
);

const InitialAvatar = ({ name }: { name: string }) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return (
    <span
      aria-hidden="true"
      className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 text-foreground shadow-sm"
      style={{ backgroundColor: `hsl(${h} 70% 50% / 0.15)`, border: `1px solid hsl(${h} 70% 50% / 0.3)` }}
    >
      {name.trim().charAt(0)}
    </span>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="h-full min-h-[160px] flex items-center justify-center text-sm text-muted-foreground text-center px-4 font-medium">
    {message}
  </div>
);

export default DashboardPage;
