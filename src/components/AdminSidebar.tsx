import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useAppMode } from "@/hooks/useAppMode";
import { useTheme } from "./ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Baby,
  Users,
  CreditCard,
  Files,
  Settings,
  Plus,
  Languages,
  HelpCircle,
  LogOut,
  Trees,
  Sun,
  Moon,
  Sparkles,
  X,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, labelKey: "sidebar.dashboard", path: "/admin", adminOnly: false },
  { icon: Baby, labelKey: "sidebar.children", path: "/admin/children", adminOnly: false },
  { icon: Users, labelKey: "sidebar.staff", path: "/admin/staff", adminOnly: true },
  { icon: CreditCard, labelKey: "sidebar.finance", path: "/admin/finance", adminOnly: true },
  { icon: Files, labelKey: "sidebar.reports", path: "/admin/reports", adminOnly: true },
  { icon: Settings, labelKey: "sidebar.settings", path: "/admin/settings", adminOnly: true },
];

const AdminSidebar = ({ isOpen = false, onClose = () => {} }: { isOpen?: boolean; onClose?: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { t, i18n } = useTranslation();
  const { mode, toggleMode } = useAppMode();
  const { theme, setTheme } = useTheme();

  // Shuttering Hover State (Desktop)
  const [isHovered, setIsHovered] = useState(false);

  const isAdmin = user?.role === "admin";
  const isRtl = i18n.language === "ar";
  const isCamp = mode === "summer_camp";

  // When mobile is open, it's expanded. On desktop, expands on mouse hover.
  const isExpanded = isOpen || isHovered;

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const closedTransform = isRtl ? "translate-x-full" : "-translate-x-full";
  const workspaceName = user?.display_name || "Mina";
  const initial = workspaceName.trim().charAt(0).toUpperCase() || "M";

  return (
    <>
      {/* Mobile overlay with fade */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Shuttering Animated Sidebar (In-flow on desktop so it resizes together with main content) */}
      <motion.aside
        aria-label="Main navigation"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={false}
        animate={{
          width: isExpanded ? 260 : 72,
        }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 32,
        }}
        className={`fixed md:sticky top-0 start-0 z-40 h-screen shrink-0 flex flex-col bg-card/90 dark:bg-[#080910]/95 backdrop-blur-xl border-e border-border/80 shadow-lg overflow-hidden transition-transform duration-300 ease-out md:translate-x-0 ${
          isOpen ? "translate-x-0 z-50 w-[260px]" : closedTransform
        }`}
      >
        {/* Creative Shutter Edge Glow Line */}
        <div
          className={`absolute top-0 end-0 w-[2px] h-full transition-opacity duration-500 pointer-events-none bg-gradient-to-b from-transparent via-primary to-transparent ${
            isHovered ? "opacity-100" : "opacity-30"
          }`}
        />

        {/* 1. Header: Product mark + workspace (M / Mina / Viora) */}
        <div className="pt-5 pb-4 px-3 flex items-center shrink-0 min-h-[68px]">
          <div className="flex items-center gap-3 w-full">
            {/* Monogram Icon / Initial with Animated Ambient Glow */}
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNav("/admin")}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-[#9e002b] to-[#600018] text-white flex items-center justify-center font-headline font-black text-base shrink-0 shadow-lg shadow-primary/30 border border-white/20 cursor-pointer relative group"
            >
              <div className="absolute -inset-1 rounded-xl bg-primary/40 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10">{initial}</span>
            </motion.div>

            {/* Sliding Workspace Labels */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, x: isRtl ? 12 : -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRtl ? 12 : -12 }}
                  transition={{ duration: 0.2 }}
                  className="min-w-0 flex-1 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-foreground truncate leading-tight font-headline flex items-center gap-1.5">
                      {workspaceName}
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5 font-medium">
                      Viora · {isCamp ? (isRtl ? "المعسكر الصيفي" : "Summer camp") : (isRtl ? "الحضانة" : "Nursery")}
                    </p>
                  </div>
                  {/* Explicit mobile close button */}
                  <button
                    onClick={onClose}
                    className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    aria-label="Close sidebar"
                  >
                    <X size={18} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 2. Scope Switch: Nursery / Camp */}
        <div className="px-3 pb-4 shrink-0">
          {isExpanded ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              role="tablist"
              className="grid grid-cols-2 p-1 rounded-xl bg-muted/60 dark:bg-white/[0.05] border border-border/60 relative"
            >
              <button
                role="tab"
                aria-selected={!isCamp}
                onClick={() => isCamp && toggleMode()}
                className={`relative z-10 press flex items-center justify-center gap-1.5 h-7 rounded-lg text-xs font-bold transition-colors ${
                  !isCamp ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {!isCamp && (
                  <motion.div
                    layoutId="mode-switch-active-pill"
                    className="absolute inset-0 bg-card dark:bg-[#121422] rounded-lg shadow-sm border border-border/60"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <Baby size={13} strokeWidth={2.2} className="relative z-10 text-primary" />
                <span className="relative z-10">{isRtl ? "حضانة" : "Nursery"}</span>
              </button>
              <button
                role="tab"
                aria-selected={isCamp}
                onClick={() => !isCamp && toggleMode()}
                className={`relative z-10 press flex items-center justify-center gap-1.5 h-7 rounded-lg text-xs font-bold transition-colors ${
                  isCamp ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isCamp && (
                  <motion.div
                    layoutId="mode-switch-active-pill"
                    className="absolute inset-0 bg-card dark:bg-[#121422] rounded-lg shadow-sm border border-border/60"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <Trees size={13} strokeWidth={2.2} className="relative z-10 text-emerald-400" />
                <span className="relative z-10">{isRtl ? "معسكر" : "Camp"}</span>
              </button>
            </motion.div>
          ) : (
            /* Shutter Collapsed Mode Icon Toggle */
            <div className="flex justify-center">
              <button
                onClick={toggleMode}
                title={isCamp ? "Switch to Nursery" : "Switch to Summer Camp"}
                className="w-10 h-7 rounded-lg bg-muted/60 dark:bg-white/[0.05] border border-border/60 flex items-center justify-center text-primary hover:scale-105 transition-transform"
              >
                {isCamp ? <Trees size={14} className="text-emerald-400" /> : <Baby size={14} className="text-primary" />}
              </button>
            </div>
          )}
        </div>

        {/* 3. Navigation List with sliding active indicator */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar px-2 pb-4">
          <nav className="flex flex-col gap-1">
            {navItems
              .filter((item) => !item.adminOnly || isAdmin)
              .map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    aria-current={active ? "page" : undefined}
                    title={!isExpanded ? t(item.labelKey) : undefined}
                    className={`relative focus-ring flex items-center h-10 px-3 rounded-xl text-sm w-full transition-all font-semibold ${
                      active
                        ? "text-primary font-bold shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface-container/60 dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active-item"
                        className="absolute inset-0 bg-primary/10 dark:bg-primary/20 border border-primary/25 rounded-xl"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    <div className="w-5 flex items-center justify-center shrink-0 relative z-10">
                      <Icon size={18} strokeWidth={active ? 2.5 : 1.8} className={active ? "text-primary" : ""} />
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.span
                          initial={{ opacity: 0, x: isRtl ? 10 : -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: isRtl ? 10 : -10 }}
                          transition={{ duration: 0.18 }}
                          className={`ms-3 truncate relative z-10 ${isRtl ? "text-right" : "text-left"}`}
                        >
                          {t(item.labelKey)}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
          </nav>

          {/* 4. Bottom Utilities: New Entry, Theme, Lang, Help, Logout */}
          <div className="mt-auto pt-4 flex flex-col gap-2.5">
            {/* New Entry Button */}
            {isAdmin && (
              <div className="px-1">
                {isExpanded ? (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNav("/admin/new-entry")}
                    className="press focus-ring w-full h-10 rounded-xl bg-gradient-to-r from-primary to-[#9e002b] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 transition-all"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                    <span>{t("sidebar.new_entry")}</span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleNav("/admin/new-entry")}
                    title={t("sidebar.new_entry")}
                    className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-r from-primary to-[#9e002b] text-white flex items-center justify-center shadow-md shadow-primary/30"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                  </motion.button>
                )}
              </div>
            )}

            {/* Bottom Actions Divider & List */}
            <div className="flex flex-col gap-1 border-t border-border/60 pt-3">
              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title={theme === "dark" ? (isRtl ? "الوضع الفاتح" : "Light mode") : (isRtl ? "الوضع الداكن" : "Dark mode")}
                className="flex items-center h-9 px-3 rounded-xl text-xs font-medium text-muted-foreground hover:bg-surface-container/60 dark:hover:bg-white/[0.06] hover:text-foreground transition-colors w-full"
              >
                <div className="w-5 flex items-center justify-center shrink-0">
                  {theme === "dark" ? <Sun size={16} strokeWidth={1.8} className="text-amber-400" /> : <Moon size={16} strokeWidth={1.8} className="text-slate-600" />}
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: isRtl ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: isRtl ? 10 : -10 }}
                      transition={{ duration: 0.18 }}
                      className="ms-3 truncate"
                    >
                      {theme === "dark" ? (isRtl ? "الوضع الفاتح" : "Light mode") : (isRtl ? "الوضع الداكن" : "Dark mode")}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* Language Switch */}
              <button
                onClick={() => i18n.changeLanguage(isRtl ? "en" : "ar")}
                title={isRtl ? "English" : "عربي"}
                className="flex items-center h-9 px-3 rounded-xl text-xs font-medium text-muted-foreground hover:bg-surface-container/60 dark:hover:bg-white/[0.06] hover:text-foreground transition-colors w-full"
              >
                <div className="w-5 flex items-center justify-center shrink-0">
                  <Languages size={16} strokeWidth={1.8} className="text-rose-400" />
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: isRtl ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: isRtl ? 10 : -10 }}
                      transition={{ duration: 0.18 }}
                      className="ms-3 truncate"
                    >
                      {isRtl ? "English" : "عربي"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* Help */}
              <button
                onClick={() => handleNav("/admin/help")}
                aria-current={isActive("/admin/help") ? "page" : undefined}
                title={t("sidebar.help")}
                className={`flex items-center h-9 px-3 rounded-xl text-xs font-medium transition-colors w-full ${
                  isActive("/admin/help")
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-muted-foreground hover:bg-surface-container/60 dark:hover:bg-white/[0.06] hover:text-foreground"
                }`}
              >
                <div className="w-5 flex items-center justify-center shrink-0">
                  <HelpCircle size={16} strokeWidth={1.8} />
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: isRtl ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: isRtl ? 10 : -10 }}
                      transition={{ duration: 0.18 }}
                      className="ms-3 truncate"
                    >
                      {t("sidebar.help")}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                title={t("sidebar.logout")}
                className="flex items-center h-9 px-3 rounded-xl text-xs font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors w-full"
              >
                <div className="w-5 flex items-center justify-center shrink-0">
                  <LogOut size={16} strokeWidth={1.8} />
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: isRtl ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: isRtl ? 10 : -10 }}
                      transition={{ duration: 0.18 }}
                      className="ms-3 truncate"
                    >
                      {t("sidebar.logout")}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default AdminSidebar;
