"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Package, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProductLite } from "./types";

// =============================================================================
// ProductCombobox — Stok sənədlərinin "Product" sütunu üçün axtarış inputu.
// Mövcud kataloqdan (real Prisma /api/inventory/products datası) seçim edir,
// tapılmadıqda birbaşa yeni məhsul yaratmaq imkanı verir (heç bir mock yoxdur).
// =============================================================================

interface ProductComboboxProps {
  products: ProductLite[];
  value: string | null;
  onSelect: (product: ProductLite) => void;
  onCreateNew?: (name: string) => Promise<void>;
  placeholder?: string;
}

export function ProductCombobox({ products, value, onSelect, onCreateNew, placeholder = "Məhsul axtar..." }: ProductComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const selected = products.find((p) => p.id === value);
  const filtered = search
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase()) ||
          (p.barcode || "").toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const handleCreateNew = async () => {
    if (!onCreateNew || !search.trim()) return;
    setCreating(true);
    try {
      await onCreateNew(search.trim());
      setOpen(false);
      setSearch("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        className={cn(buttonVariants({ variant: "outline" }), "h-9 w-full min-w-[180px] justify-between px-2.5 font-normal")}
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {selected ? (
            <span className="truncate">{selected.name}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Ad, SKU və ya barkod axtar..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>
              {onCreateNew ? (
                <button
                  type="button"
                  onClick={handleCreateNew}
                  disabled={creating || !search.trim()}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-primary hover:underline disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {creating ? "Yaradılır..." : `"${search}" adlı yeni məhsul yarat`}
                </button>
              ) : (
                "Məhsul tapılmadı"
              )}
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.id}
                  onSelect={() => {
                    onSelect(product);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check className={cn("h-3.5 w-3.5", value === product.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm">{product.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {product.sku} {product.barcode ? `· ${product.barcode}` : ""}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{product.totalQuantity} {product.unit}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
