import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, LogOut, Moon, Sun, ShieldCheck } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { motion } from "framer-motion";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/super-admin" },
];

const SuperAdminSidebar = ({ isOpen = false, onClose = () => {} }: { isOpen?: boolean; onClose?: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 md:w-64 bg-card/90 dark:bg-[#0a0c16]/95 backdrop-blur-xl flex flex-col py-8 gap-2 border-r border-sidebar-border font-headline font-medium shrink-0 transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none overflow-hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Logo & Master Node Header */}
        <div className="px-8 mb-10 flex flex-col items-center justify-center shrink-0">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 2 }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
            className="relative mb-3 group cursor-pointer"
            onClick={() => handleNav("/super-admin")}
          >
            {/* Ambient Circular Glow */}
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-primary via-rose-500 to-amber-500 opacity-50 blur-lg group-hover:opacity-85 transition-opacity" />
            <div className="relative w-18 h-18 rounded-full bg-black/90 border-2 border-primary/40 p-1.5 shadow-xl flex items-center justify-center overflow-hidden">
              <img
                src={theme === "dark" ? "/logo-light.png" : "/logo-dark.png"}
                alt="Viora Logo"
                className="w-full h-full object-cover rounded-full scale-110 filter drop-shadow-[0_0_12px_rgba(158,0,43,0.7)]"
                onError={(e) => {
                  e.currentTarget.src = "/favicon.png";
                }}
              />
            </div>
          </motion.div>

          <div className="text-center">
            <h2 className="font-black tracking-tight text-foreground text-lg flex items-center justify-center gap-1.5">
              SaaS Control
              <ShieldCheck size={16} className="text-emerald-400" />
            </h2>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-0.5">
              Master Node
            </p>
          </div>
        </div>

        {/* Nav Items */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar px-4 pb-4">
          <nav className="flex flex-col gap-1.5 mb-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-left shrink-0 font-semibold text-sm ${
                    active
                      ? "text-primary font-bold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-container-low/80 dark:hover:bg-white/[0.05]"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="super-sidebar-active"
                      className="absolute inset-0 bg-primary/10 dark:bg-primary/20 border border-primary/25 rounded-xl"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  <div className="w-6 h-6 flex items-center justify-center shrink-0 relative z-10">
                    <Icon size={18} />
                  </div>
                  <span className="truncate relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer Controls */}
          <div className="mt-auto flex flex-col gap-2 border-t border-outline-variant/20 pt-4">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-3 px-4 py-2.5 text-xs transition-colors w-full rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-container-low/80 dark:hover:bg-white/[0.05] font-semibold"
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                {theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
              </div>
              <span className="truncate">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 text-destructive/80 hover:text-destructive hover:bg-destructive/10 px-4 py-2.5 rounded-xl text-xs transition-colors w-full font-semibold"
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <LogOut size={16} />
              </div>
              <span className="truncate">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SuperAdminSidebar;
