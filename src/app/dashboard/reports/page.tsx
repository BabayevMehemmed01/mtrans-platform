import { ComingSoon } from "@/components/ui/coming-soon";
import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <ComingSoon 
        title="Hesabatlar və Analitika" 
        description="Şirkətin performansını, komanda səmərəliliyini və maliyyə hərəkətlərini qrafiklərlə görəcəyiniz modul yaxında əlavə olunacaq." 
        icon={<BarChart3 className="w-12 h-12 text-muted-foreground" />}
      />
    </div>
  );
}
