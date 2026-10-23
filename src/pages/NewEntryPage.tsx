import AdminLayout from "@/components/AdminLayout";
import { useTranslation } from "react-i18next";
import { PlusCircle } from "lucide-react";

const NewEntryPage = () => {
  const { t } = useTranslation();
  return (
    <AdminLayout>
      <header className="mb-10">
        <h2 className="text-4xl font-extrabold tracking-tight text-primary font-headline">{t('sidebar.new_entry')}</h2>
        <p className="text-foreground font-medium">Quickly add a new child, transaction, or staff member.</p>
      </header>
      
      <div className="bg-card rounded-[2rem] p-12 flex flex-col items-center justify-center min-h-[400px] border border-surface-container-highest/20 text-foreground">
        <PlusCircle size={48} className="mb-4 opacity-70" />
        <p>{t('sidebar.new_entry')} {t('common.under_construction')}</p>
      </div>
    </AdminLayout>
  );
};

export default NewEntryPage;
