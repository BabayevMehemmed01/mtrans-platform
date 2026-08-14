import { Construction, Sparkles } from "lucide-react";

import React from "react";

export function ComingSoon({ title, description, icon }: { title: string; description?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center p-8">
      <div className="relative mb-6">
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur-xl"></div>
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm">
          {icon ? icon : <Construction className="h-10 w-10 text-[hsl(var(--primary))]" />}
        </div>
      </div>
      <h2 className="text-3xl font-bold tracking-tight mb-2 flex items-center justify-center gap-2">
        {title} <Sparkles className="h-6 w-6 text-yellow-500" />
      </h2>
      <p className="text-[hsl(var(--muted-foreground))] max-w-md mx-auto text-sm leading-relaxed">
        {description || "Bu modul hazırda inkişaf mərhələsindədir. Yaxın zamanda platformaya əlavə edilərək istifadənizə veriləcək. Səbriniz üçün təşəkkür edirik!"}
      </p>
    </div>
  );
}
