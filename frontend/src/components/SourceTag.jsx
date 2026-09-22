import { FileText } from "lucide-react";

export default function SourceTag({ source }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                     bg-blue-500/10 text-blue-400 border border-blue-500/20
                     hover:bg-blue-500/20 transition-colors duration-150">
      <FileText className="w-3 h-3 flex-shrink-0" />
      {source}
    </span>
  );
}
