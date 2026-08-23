"use client";

import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

export interface CustomizeMenuItem {
  key: string;
  label: string;
  defaultVisible?: boolean;
}

interface CustomizeMenuProps {
  items: CustomizeMenuItem[];
  isVisible: (key: string, defaultVisible?: boolean) => boolean;
  setVisible: (key: string, value: boolean) => void;
  title?: string;
  triggerLabel?: string;
  align?: "start" | "end" | "center";
}

// =============================================================================
// <CustomizeMenu /> — İstifadəçiyə səhifədəki kartları/vidjetləri/sütunları
// göstərmək və ya gizlətmək imkanı verən vahid, təkrar istifadə edilə bilən UI.
// İdarəetmə vəziyyəti valideyn komponentdə `useCustomization()` hook-u ilə
// saxlanılır (bax: src/hooks/useCustomization.ts) — bu komponent "dumb" görünüşdür.
// =============================================================================
export function CustomizeMenu({
  items,
  isVisible,
  setVisible,
  title = "Görünüşü fərdiləşdir",
  triggerLabel = "Fərdiləşdir",
  align = "end",
}: CustomizeMenuProps) {
  const iconOnly = !triggerLabel;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={iconOnly ? "icon-sm" : "sm"}
          className="gap-1.5 shrink-0"
          title={iconOnly ? title : undefined}
        >
          <Settings2 className="h-3.5 w-3.5" />
          {triggerLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        <DropdownMenuLabel>{title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuCheckboxItem
            key={item.key}
            checked={isVisible(item.key, item.defaultVisible ?? true)}
            onCheckedChange={(checked) => setVisible(item.key, checked === true)}
            onSelect={(e) => e.preventDefault()}
          >
            {item.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
