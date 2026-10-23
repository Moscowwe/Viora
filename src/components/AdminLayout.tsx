import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AdminSidebar from "./AdminSidebar";
import { Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE } from "@/lib/motion";

import ProfileDropdown from "./ProfileDropdown";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="text-foreground font-headline font-bold text-xl flex items-center gap-3"
        >
          <span className="w-3 h-3 rounded-full bg-primary" />
          Loading...
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background overflow-hidden flex-col md:flex-row relative">
      
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between bg-card/85 backdrop-blur-md h-14 px-4 border-b border-border/80 z-40 sticky top-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open navigation"
            className="press focus-ring text-foreground p-2 rounded-xl hover:bg-surface-container cursor-pointer"
          >
            <Menu size={20} strokeWidth={2} />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-black border border-primary/50 p-0.5 overflow-hidden flex items-center justify-center shadow-sm">
              <img src="/logo-light.png" alt="Viora" className="w-full h-full object-cover rounded-full" />
            </div>
            <span className="font-headline font-bold text-sm text-foreground truncate">
              {user.display_name || "Viora"}
            </span>
          </div>
        </div>

        <ProfileDropdown />
      </header>

      {/* Sidebar with mobile state passed */}
      <AdminSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      {/* Main Content with smooth page entrance */}
      <main className="flex-1 min-w-0 h-[calc(100vh-56px)] md:h-screen overflow-y-auto custom-scrollbar px-4 py-6 md:px-10 md:py-8 pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminLayout;
