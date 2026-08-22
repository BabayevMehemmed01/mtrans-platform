import { LayoutTemplate } from "lucide-react";
import { ComingSoon } from "@/components/ui/coming-soon";

export function MarketingTemplatesTab() {
  return (
    <ComingSoon
      title="Templates"
      description="Email, SMS və WhatsApp üçün hazır kampaniya şablonları tezliklə əlavə olunacaq. Bu bölmə hazırda inkişaf mərhələsindədir."
      icon={<LayoutTemplate className="h-10 w-10 text-primary" />}
    />
  );
}
