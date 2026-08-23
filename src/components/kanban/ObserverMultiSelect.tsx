"use client";

import { Check, ChevronsUpDown, Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TaskMember } from "@/components/kanban/types";

interface ObserverMultiSelectProps {
  members: TaskMember[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  excludeId?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}

export function ObserverMultiSelect({
  members,
  selectedIds,
  onChange,
  excludeId,
  placeholder = "Müşahidəçi seçin",
  searchPlaceholder = "Axtar...",
  emptyText = "Nəticə yoxdur",
}: ObserverMultiSelectProps) {
  const options = members.filter((m) => m.id !== excludeId);
  const selected = options.filter((m) => selectedIds.includes(m.id));

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  };

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger type="button" className="flex h-auto min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent">
          <span className="flex min-w-0 items-center gap-2">
            <Eye className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-left">
              {selected.length === 0
                ? placeholder
                : `${selected.length} müşahidəçi`}
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((m) => {
                  const checked = selectedIds.includes(m.id);
                  return (
                    <CommandItem
                      key={m.id}
                      value={`${m.name} ${m.id}`}
                      data-checked={checked || undefined}
                      onSelect={() => toggle(m.id)}
                    >
                      <Avatar className="size-6">
                        {m.avatar ? <AvatarImage src={m.avatar} alt={m.name} /> : null}
                        <AvatarFallback className="text-[10px]">
                          {m.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate">{m.name}</span>
                      <Check className={cn("size-4", checked ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 py-0.5 pr-1 pl-1.5 text-xs"
            >
              <Avatar className="size-4">
                {m.avatar ? <AvatarImage src={m.avatar} alt={m.name} /> : null}
                <AvatarFallback className="text-[8px]">
                  {m.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {m.name}
              <button
                type="button"
                onClick={() => toggle(m.id)}
                className="rounded-full p-0.5 hover:bg-background"
                aria-label={`${m.name} çıxar`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
