import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import SuperAdminSidebar from "./SuperAdminSidebar";
import { Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE } from "@/lib/motion";

const SuperAdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (user.role !== "superadmin") {
        navigate("/admin");
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-container-low text-foreground font-headline text-xl">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="flex items-center gap-3 font-bold"
        >
          <span className="w-3 h-3 rounded-full bg-primary" />
          Loading SaaS Portal...
        </motion.div>
      </div>
    );
  }

  if (!user || user.role !== "superadmin") return null;

  return (
    <div className="flex min-h-screen bg-surface-container-low dark:bg-[#07080f] overflow-hidden flex-col md:flex-row relative">
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between bg-card/90 backdrop-blur-md p-4 border-b border-sidebar-border z-40 sticky top-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-foreground p-2 -ml-2 rounded-lg hover:bg-surface-container-low transition-colors"
          >
            <Menu size={24} />
          </button>
          <span className="font-headline font-black tracking-widest text-lg text-primary">VIORA</span>
        </div>
      </header>

      {/* Sidebar with mobile state passed */}
      <SuperAdminSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main Content with smooth animated page transitions */}
      <main className="flex-1 h-[calc(100vh-73px)] md:h-screen overflow-y-auto custom-scrollbar p-5 md:p-10 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default SuperAdminLayout;
