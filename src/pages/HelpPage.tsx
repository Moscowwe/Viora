import AdminLayout from "@/components/AdminLayout";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Eye, 
  BarChart2, 
  PieChart, 
  FileText, 
  UserCircle2, 
  Baby, 
  UserPlus, 
  Edit2, 
  Banknote, 
  Search, 
  Filter, 
  Users, 
  MinusCircle, 
  PlusCircle, 
  Folder, 
  Download, 
  History, 
  Files, 
  Play, 
  Printer, 
  Archive, 
  Languages, 
  Settings, 
  Sliders, 
  RotateCcw, 
  Trash2, 
  Camera, 
  Lock, 
  LogOut, 
  BookOpen, 
  ChevronDown, 
  Lightbulb, 
  Zap 
} from "lucide-react";

type Section = {
  id: string;
  icon: any;
  titleKey: string;
  descKey: string;
  color: string;
  steps: { iconStep: any; textKey: string }[];
};

const sections: Section[] = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    titleKey: "help.section_dashboard",
    descKey: "help.section_dashboard_desc",
    color: "bg-baby-blue/15 text-secondary",
    steps: [
      { iconStep: Eye, textKey: "help.dash_step_1" },
      { iconStep: BarChart2, textKey: "help.dash_step_2" },
      { iconStep: PieChart, textKey: "help.dash_step_3" },
      { iconStep: FileText, textKey: "help.dash_step_4" },
      { iconStep: UserCircle2, textKey: "help.dash_step_5" },
    ],
  },
  {
    id: "children",
    icon: Baby,
    titleKey: "help.section_children",
    descKey: "help.section_children_desc",
    color: "bg-baby-pink/15 text-primary",
    steps: [
      { iconStep: UserPlus, textKey: "help.children_step_1" },
      { iconStep: Edit2, textKey: "help.children_step_2" },
      { iconStep: Banknote, textKey: "help.children_step_3" },
      { iconStep: Search, textKey: "help.children_step_4" },
      { iconStep: Filter, textKey: "help.children_step_5" },
    ],
  },
  {
    id: "staff",
    icon: Users,
    titleKey: "help.section_staff",
    descKey: "help.section_staff_desc",
    color: "bg-tertiary-container/20 text-tertiary",
    steps: [
      { iconStep: UserPlus, textKey: "help.staff_step_1" },
      { iconStep: Banknote, textKey: "help.staff_step_2" },
      { iconStep: MinusCircle, textKey: "help.staff_step_3" },
      { iconStep: Edit2, textKey: "help.staff_step_4" },
    ],
  },
  {
    id: "finance",
    icon: Banknote,
    titleKey: "help.section_finance",
    descKey: "help.section_finance_desc",
    color: "bg-green-100 text-green-700",
    steps: [
      { iconStep: PlusCircle, textKey: "help.finance_step_1" },
      { iconStep: Folder, textKey: "help.finance_step_2" },
      { iconStep: Download, textKey: "help.finance_step_3" },
      { iconStep: History, textKey: "help.finance_step_4" },
    ],
  },
  {
    id: "reports",
    icon: Files,
    titleKey: "help.section_reports",
    descKey: "help.section_reports_desc",
    color: "bg-purple-100 text-purple-700",
    steps: [
      { iconStep: Play, textKey: "help.reports_step_1" },
      { iconStep: Printer, textKey: "help.reports_step_2" },
      { iconStep: Archive, textKey: "help.reports_step_3" },
      { iconStep: Languages, textKey: "help.reports_step_4" },
    ],
  },
  {
    id: "settings",
    icon: Settings,
    titleKey: "help.section_settings",
    descKey: "help.section_settings_desc",
    color: "bg-orange-100 text-orange-700",
    steps: [
      { iconStep: Sliders, textKey: "help.settings_step_1" },
      { iconStep: RotateCcw, textKey: "help.settings_step_2" },
      { iconStep: Trash2, textKey: "help.settings_step_3" },
    ],
  },
  {
    id: "profile",
    icon: UserCircle2,
    titleKey: "help.section_profile",
    descKey: "help.section_profile_desc",
    color: "bg-sky-100 text-sky-700",
    steps: [
      { iconStep: Edit2, textKey: "help.profile_step_1" },
      { iconStep: Camera, textKey: "help.profile_step_2" },
      { iconStep: Lock, textKey: "help.profile_step_3" },
      { iconStep: LogOut, textKey: "help.profile_step_4" },
    ],
  },
];

const HelpPage = () => {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>("dashboard");

  const toggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <AdminLayout>
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-baby-blue/15 flex items-center justify-center">
            <BookOpen className="text-secondary" size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground font-headline">
              {t("help.title")}
            </h2>
            <p className="text-foreground font-medium text-sm mt-1">
              {t("help.subtitle")}
            </p>
          </div>
        </div>
      </header>

      {/* Quick Overview Banner */}
      <div className="bg-gradient-to-br from-baby-blue/10 via-baby-pink/5 to-tertiary-container/10 rounded-3xl p-8 mb-8 border border-surface-container-highest/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-baby-blue/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative">
          <h3 className="text-2xl font-bold font-headline text-foreground mb-3">
            {t("help.overview_title")}
          </h3>
          <p className="text-foreground leading-relaxed max-w-3xl">
            {t("help.overview_desc")}
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setExpandedId(s.id);
                  document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold ${s.color} hover:shadow-md transition-all cursor-pointer active:scale-95`}
              >
                <s.icon size={14} />
                {t(s.titleKey)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-3">
        {sections.map((section) => {
          const isOpen = expandedId === section.id;
          return (
            <div
              key={section.id}
              id={`section-${section.id}`}
              className={`bg-card rounded-2xl border overflow-hidden transition-all duration-300 ${
                isOpen
                  ? "border-baby-blue/30 shadow-lg shadow-baby-blue/5"
                  : "border-surface-container-highest/15 hover:border-surface-container-highest/30"
              }`}
            >
              {/* Accordion Header */}
              <button
                onClick={() => toggle(section.id)}
                className="w-full flex items-center gap-4 p-6 text-left transition-colors hover:bg-surface-container-low/50"
              >
                <div className={`w-12 h-12 rounded-xl ${section.color} flex items-center justify-center shrink-0`}>
                  <section.icon size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-bold font-headline text-foreground">
                    {t(section.titleKey)}
                  </h4>
                  <p className="text-foreground text-sm mt-0.5 truncate">
                    {t(section.descKey)}
                  </p>
                </div>
                <ChevronDown
                  className={`text-foreground/40 transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  size={20}
                />
              </button>

              {/* Accordion Content */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-6 pt-2">
                  <div className="bg-surface-container-low/50 rounded-xl p-5">
                    <ol className="space-y-4">
                      {section.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-4">
                          {/* Step Number */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="w-8 h-8 rounded-lg bg-baby-blue/10 text-secondary flex items-center justify-center text-xs font-black">
                              {i + 1}
                            </div>
                            <step.iconStep size={18} className={`opacity-60 ${section.color.split(" ")[1]}`} />
                          </div>
                          {/* Step Text */}
                          <p className="text-foreground text-sm font-medium leading-relaxed pt-1.5">
                            {t(step.textKey)}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Tips */}
      <div className="mt-10 bg-card rounded-2xl p-8 border border-surface-container-highest/15">
        <div className="flex items-center gap-3 mb-5">
          <Lightbulb className="text-tertiary" size={24} />
          <h4 className="text-xl font-bold font-headline text-foreground">{t("help.tips_title")}</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-surface-container-low/40 rounded-xl">
              <Zap className="text-baby-blue mt-0.5" size={18} />
              <p className="text-foreground text-sm font-medium leading-relaxed">
                {t(`help.tip_${i}`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default HelpPage;
