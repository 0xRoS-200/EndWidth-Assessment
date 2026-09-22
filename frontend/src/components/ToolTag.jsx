import { Wrench } from "lucide-react";

// Human-readable tool labels
const TOOL_LABELS = {
  search_company_documents: "Document Search",
  get_employee_info: "Employee Info",
  apply_leave: "Apply Leave",
};

export default function ToolTag({ tool }) {
  const label = TOOL_LABELS[tool] || tool;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                     bg-emerald-500/10 text-emerald-400 border border-emerald-500/20
                     hover:bg-emerald-500/20 transition-colors duration-150">
      <Wrench className="w-3 h-3 flex-shrink-0" />
      {label}
    </span>
  );
}
