import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  X, 
  Lock, 
  Key, 
  EyeOff, 
  Eye, 
  AlertCircle, 
  Check, 
  Loader2 
} from "lucide-react";

interface Props {
  onClose: () => void;
}

const ChangePasswordModal = ({ onClose }: Props) => {
  const { t } = useTranslation();
  const { changePassword } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (newPassword.length < 6) {
      setError(t("profile.password_min_length"));
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError(t("profile.passwords_no_match"));
      return false;
    }
    setError("");
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      await changePassword(newPassword);
      toast.success(t("profile.password_updated"));
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-tertiary-container/20 flex items-center justify-center">
              <Lock className="text-tertiary" size={20} />
            </div>
            <h2 className="text-2xl font-bold font-headline text-foreground">
              {t("profile.change_password")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-surface-container-low/80 flex items-center justify-center text-foreground hover:bg-surface-container-low/80-high transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          {/* New Password */}
          <div className="space-y-2">
            <label className="text-foreground font-semibold text-sm ml-1 block">
              {t("profile.new_password")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Key className="text-outline" size={18} />
              </div>
              <input
                className="w-full bg-surface-container-low border-none rounded-xl py-3.5 pl-12 pr-12 text-foreground focus:ring-4 focus:ring-baby-blue/20 transition-all placeholder:text-outline-variant text-sm font-medium"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder={t("profile.new_password_placeholder")}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-4 flex items-center text-outline hover:text-foreground transition-colors"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-foreground font-semibold text-sm ml-1 block">
              {t("profile.confirm_password")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Lock className="text-outline" size={18} />
              </div>
              <input
                className="w-full bg-surface-container-low border-none rounded-xl py-3.5 pl-12 pr-12 text-foreground focus:ring-4 focus:ring-baby-blue/20 transition-all placeholder:text-outline-variant text-sm font-medium"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder={t("profile.confirm_password_placeholder")}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-4 flex items-center text-outline hover:text-foreground transition-colors"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-destructive/5 rounded-xl text-destructive text-sm font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Password Strength Hint */}
          <p className="text-[11px] text-foreground/50 font-medium ml-1">
            {t("profile.password_hint")}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl border border-surface-container-highest/30 bg-card font-bold text-sm text-foreground hover:bg-surface-container-low/80 transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !newPassword || !confirmPassword}
            className="flex-1 py-3.5 rounded-xl bg-tertiary text-white font-bold text-sm hover:bg-tertiary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t("profile.saving")}
              </>
            ) : (
              <>
                <Check size={18} />
                {t("profile.update_password")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
