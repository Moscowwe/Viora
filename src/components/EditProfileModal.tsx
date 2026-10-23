import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { 
  X, 
  Camera, 
  User, 
  Mail, 
  Check, 
  Loader2 
} from "lucide-react";

interface Props {
  onClose: () => void;
}

const EditProfileModal = ({ onClose }: Props) => {
  const { user, updateUserMeta } = useAuth();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(
    user?.display_name || user?.email?.split("@")[0] || ""
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatar_url || null
  );
  const [saving, setSaving] = useState(false);

  const initial = (displayName.charAt(0) || "A").toUpperCase();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, and WebP images are allowed");
      return;
    }

    // Validate size (max 200KB)
    if (file.size > 200 * 1024) {
      toast.error(t("profile.avatar_too_large") || "Image too large (max 200KB)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      const updates: { display_name: string; avatar_url?: string } = {
        display_name: displayName,
      };

      if (avatarPreview && avatarPreview.startsWith('data:image/') && avatarPreview !== user?.avatar_url) {
        updates.avatar_url = avatarPreview;
      }

      await updateUserMeta(updates);
      
      toast.success(t("profile.profile_updated") || "Profile updated successfully");
      onClose();
    } catch (err: unknown) {
      console.error("Profile update error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
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
          <h2 className="text-2xl font-bold font-headline text-foreground">
            {t("profile.edit_profile")}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-surface-container-low/80 flex items-center justify-center text-foreground hover:bg-surface-container-low/80-high transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-28 h-28 rounded-full object-cover ring-4 ring-baby-blue/20 transition-all group-hover:ring-baby-blue/40"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-baby-blue flex items-center justify-center text-white text-4xl font-bold ring-4 ring-baby-blue/20 transition-all group-hover:ring-baby-blue/40">
                {initial}
              </div>
            )}
            {/* Hover Overlay */}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Camera className="text-white" size={24} />
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 text-xs font-bold text-baby-blue hover:underline"
          >
            {t("profile.change_avatar")}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          {/* Display Name */}
          <div className="space-y-2">
            <label className="text-foreground font-semibold text-sm ml-1 block">
              {t("profile.full_name")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <User className="text-outline" size={18} />
              </div>
              <input
                className="w-full bg-surface-container-low border-none rounded-xl py-3.5 pl-12 pr-5 text-foreground focus:ring-4 focus:ring-baby-blue/20 transition-all placeholder:text-outline-variant text-sm font-medium"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("profile.full_name")}
              />
            </div>
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <label className="text-foreground font-semibold text-sm ml-1 flex items-center gap-2">
              {t("profile.email")}
              <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 bg-surface-container-low/80 rounded-full text-foreground font-bold">
                {t("profile.read_only")}
              </span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Mail className="text-outline" size={18} />
              </div>
              <input
                className="w-full bg-surface-container-low border-none rounded-xl py-3.5 pl-12 pr-5 text-foreground/60 text-sm font-medium cursor-not-allowed"
                type="email"
                value={user?.email || ""}
                readOnly
              />
            </div>
          </div>
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
            disabled={saving || !displayName.trim()}
            className="flex-1 py-3.5 rounded-xl bg-baby-blue text-white font-bold text-sm hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t("profile.saving")}
              </>
            ) : (
              <>
                <Check size={18} />
                {t("common.save")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
