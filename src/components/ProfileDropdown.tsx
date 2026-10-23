import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { 
  ChevronDown, 
  Edit2, 
  Lock, 
  LogOut 
} from "lucide-react";
import EditProfileModal from "./EditProfileModal";
import ChangePasswordModal from "./ChangePasswordModal";

const ProfileDropdown = () => {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const avatarUrl = user?.avatar_url;
  const displayName = user?.display_name || user?.email?.split("@")[0] || "";
  const initial = (displayName.charAt(0) || "A").toUpperCase();
  const role = user?.role || "Director";

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <>
      <div className="relative" ref={ref}>
        {/* Clickable Profile Card */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-4 bg-card p-2 pr-6 rounded-full shadow-tactile border border-surface-container-highest/30 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer select-none"
        >
          {/* Avatar */}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-baby-blue/30"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-baby-blue flex items-center justify-center text-white font-bold text-lg ring-2 ring-baby-blue/30">
              {initial}
            </div>
          )}
          <div className="flex flex-col text-left">
            <p className="font-bold text-foreground leading-none">{user?.email || "Admin"}</p>
            <p className="text-[10px] font-bold text-foreground uppercase tracking-widest mt-1 opacity-60">
              {role}
            </p>
          </div>
          <ChevronDown
            className={`text-foreground/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            size={14}
          />
        </button>

        {/* Dropdown Menu */}
        <div
          className={`absolute right-0 top-full mt-2 w-64 bg-card rounded-2xl shadow-xl border border-surface-container-highest/20 z-50 overflow-hidden transition-all duration-200 origin-top-right ${
            open
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
          }`}
        >
          {/* User Info Header */}
          <div className="px-5 pt-5 pb-4 border-b border-surface-container-highest/15">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-baby-blue flex items-center justify-center text-white font-bold">
                  {initial}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-foreground text-sm truncate">{displayName}</p>
                <p className="text-[10px] text-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2 px-2">
            <button
              onClick={() => {
                setOpen(false);
                setShowEditProfile(true);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left text-sm font-semibold text-foreground hover:bg-surface-container-low/80 transition-colors duration-150"
            >
              <Edit2 className="text-baby-blue" size={18} />
              {t("profile.edit_profile")}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setShowChangePassword(true);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left text-sm font-semibold text-foreground hover:bg-surface-container-low/80 transition-colors duration-150"
            >
              <Lock className="text-tertiary" size={18} />
              {t("profile.change_password")}
            </button>
            <div className="my-1 mx-3 border-t border-surface-container-highest/15" />
            <button
              onClick={() => {
                setOpen(false);
                setShowLogoutConfirm(true);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left text-sm font-semibold text-destructive hover:bg-destructive/5 transition-colors duration-150"
            >
              <LogOut size={18} />
              {t("sidebar.logout")}
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditProfile && (
        <EditProfileModal onClose={() => setShowEditProfile(false)} />
      )}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
              <LogOut className="text-destructive" size={32} />
            </div>
            <h3 className="text-xl font-bold font-headline text-foreground mb-2">
              {t("profile.logout_confirm_title")}
            </h3>
            <p className="text-foreground text-sm mb-8">
              {t("profile.logout_confirm_desc")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-surface-container-highest/30 bg-card font-bold text-sm text-foreground hover:bg-surface-container-low/80 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground font-bold text-sm hover:bg-destructive/90 transition-colors"
              >
                {t("sidebar.logout")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileDropdown;
