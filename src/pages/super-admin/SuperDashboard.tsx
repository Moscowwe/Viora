import { useState, useEffect } from "react";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import { Tenant } from "@/types";
import {
  Plus,
  Trash2,
  CalendarPlus,
  Ban,
  CheckCircle2,
  Building2,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Clock,
  KeyRound,
  Mail,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { CountUp } from "@/lib/motion";

const SuperDashboard = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: "", email: "", password: "", days: 30 });

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = () => {
    const data = localStorage.getItem("viora_saas_tenants");
    if (data) {
      setTenants(JSON.parse(data));
    }
  };

  const saveTenants = (newTenants: Tenant[]) => {
    localStorage.setItem("viora_saas_tenants", JSON.stringify(newTenants));
    setTenants(newTenants);
  };

  const handleAddTenant = (e: React.FormEvent) => {
    e.preventDefault();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + newTenant.days);

    const tenant: Tenant = {
      id: crypto.randomUUID(),
      name: newTenant.name,
      admin_email: newTenant.email,
      admin_password: newTenant.password,
      subscription_end_date: expiry.toISOString(),
      status: "active",
      created_at: new Date().toISOString(),
    };

    saveTenants([...tenants, tenant]);
    toast.success("Tenant added successfully");
    setIsAddOpen(false);
    setNewTenant({ name: "", email: "", password: "", days: 30 });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to completely delete this tenant and all their data?")) return;

    const filtered = tenants.filter((t) => t.id !== id);
    saveTenants(filtered);

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(`viora_${id}_`)) {
        localStorage.removeItem(key);
      }
    });

    toast.success("Tenant deleted.");
  };

  const handleAddDays = (id: string, days: number) => {
    const updated = tenants.map((t) => {
      if (t.id === id) {
        const currentEnd = new Date(t.subscription_end_date);
        const newEnd = currentEnd < new Date() ? new Date() : currentEnd;
        newEnd.setDate(newEnd.getDate() + days);
        return { ...t, subscription_end_date: newEnd.toISOString() };
      }
      return t;
    });
    saveTenants(updated);
    toast.success(`Added ${days} days to subscription.`);
  };

  const handleToggleStatus = (id: string) => {
    const updated = tenants.map((t) => {
      if (t.id === id) {
        return { ...t, status: (t.status === "active" ? "suspended" : "active") as "active" | "suspended" };
      }
      return t;
    });
    saveTenants(updated);
    toast.success("Tenant status updated.");
  };

  const activeCount = tenants.filter(
    (t) => t.status === "active" && new Date(t.subscription_end_date) > new Date()
  ).length;

  return (
    <SuperAdminLayout>
      {/* Animated Header */}
      <motion.header
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex flex-wrap justify-between items-end gap-4 pb-4 border-b border-border/40"
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground font-headline">
              SaaS Overview
            </h2>
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Sparkles size={12} className="animate-pulse" /> Live Node
            </span>
          </div>
          <p className="text-muted-foreground font-medium text-sm md:text-base mt-1.5">
            Manage your nursery clients, tenants, and active cloud subscriptions.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsAddOpen(true)}
          className="bg-gradient-to-r from-primary to-[#9e002b] text-white shadow-lg shadow-primary/25 rounded-xl px-5 py-3 font-bold text-sm flex items-center justify-center gap-2 hover:shadow-primary/40 transition-all cursor-pointer"
        >
          <Plus size={18} strokeWidth={2.5} />
          New Account
        </motion.button>
      </motion.header>

      {/* Animated Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Total Accounts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ y: -3, scale: 1.01 }}
          className="bg-card dark:bg-[#0c0e18]/80 backdrop-blur-md p-6 rounded-2xl border border-border/60 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 end-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
          <div className="text-muted-foreground font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
            <Building2 size={16} className="text-primary" />
            Total Accounts
          </div>
          <div className="text-4xl font-black text-foreground font-headline">
            <CountUp value={tenants.length} duration={1} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Registered nursery spaces</p>
        </motion.div>

        {/* Active & Paid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ y: -3, scale: 1.01 }}
          className="bg-card dark:bg-[#0c0e18]/80 backdrop-blur-md p-6 rounded-2xl border border-emerald-500/20 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 end-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-colors" />
          <div className="absolute -right-4 -bottom-4 opacity-10 text-emerald-500 pointer-events-none">
            <Building2 size={110} />
          </div>
          <div className="text-emerald-500 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
            <CheckCircle2 size={16} />
            Active & Paid
          </div>
          <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 font-headline">
            <CountUp value={activeCount} duration={1} />
          </div>
          <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-2">
            Operational with valid licenses
          </p>
        </motion.div>

        {/* Expired / Suspended */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ y: -3, scale: 1.01 }}
          className="bg-card dark:bg-[#0c0e18]/80 backdrop-blur-md p-6 rounded-2xl border border-destructive/20 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 end-0 w-24 h-24 bg-destructive/10 rounded-full blur-2xl group-hover:bg-destructive/15 transition-colors" />
          <div className="absolute -right-4 -bottom-4 opacity-10 text-destructive pointer-events-none">
            <Ban size={110} />
          </div>
          <div className="text-destructive font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
            <ShieldAlert size={16} />
            Expired / Suspended
          </div>
          <div className="text-4xl font-black text-destructive font-headline">
            <CountUp value={tenants.length - activeCount} duration={1} />
          </div>
          <p className="text-xs text-destructive/70 mt-2">Needs renewal or reactivated access</p>
        </motion.div>
      </div>

      {/* Tenants Table with Framer Motion */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="bg-card dark:bg-[#0c0e18]/90 backdrop-blur-md rounded-2xl border border-border/60 shadow-lg overflow-hidden"
      >
        <div className="p-4 px-6 border-b border-border/40 flex items-center justify-between">
          <h3 className="font-headline font-bold text-base text-foreground flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" />
            Client Spaces Directory
          </h3>
          <span className="text-xs text-muted-foreground font-mono">
            {tenants.length} {tenants.length === 1 ? "tenant" : "tenants"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/40 bg-muted/40 dark:bg-white/[0.02]">
                <th className="p-4 px-6 font-bold text-foreground text-xs uppercase tracking-wider">Nursery Name</th>
                <th className="p-4 px-6 font-bold text-foreground text-xs uppercase tracking-wider">Admin Email</th>
                <th className="p-4 px-6 font-bold text-foreground text-xs uppercase tracking-wider">Password</th>
                <th className="p-4 px-6 font-bold text-foreground text-xs uppercase tracking-wider">Status</th>
                <th className="p-4 px-6 font-bold text-foreground text-xs uppercase tracking-wider">Expiry Date</th>
                <th className="p-4 px-6 font-bold text-foreground text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant, idx) => {
                const isExpired = new Date(tenant.subscription_end_date) < new Date();
                return (
                  <motion.tr
                    key={tenant.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="border-b border-border/20 hover:bg-muted/30 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="p-4 px-6 font-bold text-foreground flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                        {tenant.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{tenant.name}</span>
                    </td>
                    <td className="p-4 px-6 text-foreground font-medium text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                        <Mail size={14} />
                        <span>{tenant.admin_email}</span>
                      </div>
                    </td>
                    <td className="p-4 px-6 text-foreground font-mono text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <KeyRound size={13} />
                        <span>{tenant.admin_password}</span>
                      </div>
                    </td>
                    <td className="p-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          tenant.status === "suspended"
                            ? "bg-destructive/10 text-destructive border border-destructive/20"
                            : isExpired
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            tenant.status === "suspended"
                              ? "bg-destructive"
                              : isExpired
                              ? "bg-amber-500"
                              : "bg-emerald-500 animate-pulse"
                          }`}
                        />
                        {tenant.status === "suspended" ? "Suspended" : isExpired ? "Expired" : "Active"}
                      </span>
                    </td>
                    <td className="p-4 px-6 text-foreground font-medium text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock size={14} />
                        <span>{format(new Date(tenant.subscription_end_date), "MMM dd, yyyy")}</span>
                      </div>
                    </td>
                    <td className="p-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleAddDays(tenant.id, 30)}
                          className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all cursor-pointer"
                          title="Add 30 Days"
                        >
                          <CalendarPlus size={16} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleToggleStatus(tenant.id)}
                          className={`p-2 rounded-lg transition-all cursor-pointer ${
                            tenant.status === "active"
                              ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white"
                              : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                          }`}
                          title={tenant.status === "active" ? "Suspend" : "Activate"}
                        >
                          {tenant.status === "active" ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(tenant.id)}
                          className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all cursor-pointer"
                          title="Delete Account"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground font-medium">
                    No accounts found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Animated Add Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border/60 shadow-2xl bg-card dark:bg-[#0c0e18] text-foreground">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl font-black text-foreground flex items-center gap-2">
              <Plus size={22} className="text-primary" />
              Add New Client Space
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground font-medium pt-1">
              Create a new isolated nursery tenant workspace.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddTenant} className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Nursery Name</label>
              <input
                className="w-full bg-muted/60 dark:bg-white/[0.06] border border-border/80 focus:border-primary rounded-xl py-3 px-4 text-foreground focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm outline-none"
                required
                value={newTenant.name}
                onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                placeholder="e.g. Prodigy Academy"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Admin Email</label>
              <input
                className="w-full bg-muted/60 dark:bg-white/[0.06] border border-border/80 focus:border-primary rounded-xl py-3 px-4 text-foreground focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm outline-none"
                required
                type="email"
                value={newTenant.email}
                onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                placeholder="admin@prodigy.ro"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Admin Password</label>
              <input
                className="w-full bg-muted/60 dark:bg-white/[0.06] border border-border/80 focus:border-primary rounded-xl py-3 px-4 text-foreground focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm outline-none"
                required
                minLength={6}
                value={newTenant.password}
                onChange={(e) => setNewTenant({ ...newTenant, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Initial Days Granted</label>
              <input
                className="w-full bg-muted/60 dark:bg-white/[0.06] border border-border/80 focus:border-primary rounded-xl py-3 px-4 text-foreground focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm outline-none"
                required
                type="number"
                min={1}
                value={newTenant.days}
                onChange={(e) => setNewTenant({ ...newTenant, days: parseInt(e.target.value) || 30 })}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-[#9e002b] text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/30 mt-4 cursor-pointer"
            >
              Deploy Nursery Tenant
            </motion.button>
          </form>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
};

export default SuperDashboard;
