"use client";

import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, FileSpreadsheet, FileText, Link2, Loader2, UploadCloud, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useT";

// =============================================================================
// <MigrateDataDialog /> — Anbar (WMS) məlumatlarını xarici mənbədən köçürmək
// üçün modal. Excel/CSV üçün real drag-drop fayl seçimi, Zoho/QuickBooks üçün
// isə OAuth-a bənzər "qoşulma" axını göstərir. Backend inteqrasiyası hazır
// olana qədər idxal nəticəsi mock (simulyasiya) olaraq hesablanır — .env
// açarları quraşdırılan kimi bu axın real API çağırışı ilə əvəz oluna bilər.
// =============================================================================

type MigrateSource = "excel" | "csv" | "zoho" | "quickbooks";

const SOURCES: {
  id: MigrateSource;
  label: string;
  descKey: string;
  icon: typeof FileSpreadsheet;
  kind: "file" | "api";
  accept?: string;
}[] = [
  { id: "excel", label: "Excel", descKey: "inventory.migrateExcelDesc", icon: FileSpreadsheet, kind: "file", accept: ".xlsx,.xls" },
  { id: "csv", label: "CSV", descKey: "inventory.migrateCsvDesc", icon: FileText, kind: "file", accept: ".csv" },
  { id: "zoho", label: "Zoho Inventory", descKey: "inventory.migrateZohoDesc", icon: Link2, kind: "api" },
  { id: "quickbooks", label: "QuickBooks", descKey: "inventory.migrateQbDesc", icon: Link2, kind: "api" },
];

const ENV_HINT: Record<Extract<MigrateSource, "zoho" | "quickbooks">, string> = {
  zoho: "ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN",
  quickbooks: "QUICKBOOKS_CLIENT_ID, QUICKBOOKS_CLIENT_SECRET, QUICKBOOKS_REALM_ID",
};

interface MigrateDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MigrateDataDialog({ open, onOpenChange }: MigrateDataDialogProps) {
  const t = useT();
  const [source, setSource] = useState<MigrateSource>("excel");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [importedCount, setImportedCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeSource = SOURCES.find((s) => s.id === source) ?? SOURCES[0];

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setImportedCount(0);
    setIsDragging(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }, []);

  const startImport = () => {
    setStatus("loading");
    // TODO(backend): Excel/CSV real parse (SheetJS) və Zoho/QuickBooks OAuth inteqrasiyası
    // hazır olduqda bu simulyasiyanı faktiki API çağırışı ilə əvəzləyin.
    window.setTimeout(() => {
      const mockCount = Math.floor(Math.random() * 80) + 20;
      setImportedCount(mockCount);
      setStatus("done");
      toast.success(t("inventory.migrateSuccess").replace("{count}", String(mockCount)));
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("inventory.migrateDialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("inventory.migrateDialogDesc")}
          </DialogDescription>
        </DialogHeader>

        {status === "done" ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="size-7 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t("inventory.migrateDone")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("inventory.migrateDoneDesc")
                  .replace("{source}", activeSource.label)
                  .replace("{count}", String(importedCount))}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SOURCES.map((s) => {
                const Icon = s.icon;
                const active = s.id === source;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSource(s.id);
                      setFile(null);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all",
                      active
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-muted-foreground/40"
                    )}
                  >
                    <Icon className="size-5" />
                    <span className="text-[11px] font-semibold">{s.label}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground">{t(activeSource.descKey)}</p>

            {activeSource.kind === "file" ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                  isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
                )}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept={activeSource.accept}
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {file ? (
                  <>
                    <FileSpreadsheet className="size-8 text-primary" />
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                    >
                      <X className="size-3.5" /> {t("inventory.migrateRemoveFile")}
                    </Button>
                  </>
                ) : (
                  <>
                    <UploadCloud className="size-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">{t("inventory.migrateDrop")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("inventory.migrateFormats").replace("{accept}", activeSource.accept ?? "")}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-8 text-center">
                <Link2 className="size-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("inventory.migrateConnectTitle").replace("{source}", activeSource.label)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("inventory.migrateConnectHint").replace(
                      "{env}",
                      ENV_HINT[activeSource.id as "zoho" | "quickbooks"]
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {status === "done" ? (
            <Button onClick={() => handleClose(false)} className="w-full">
              {t("inventory.migrateClose")}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>
                {t("inventory.cancel")}
              </Button>
              <Button
                onClick={startImport}
                disabled={status === "loading" || (activeSource.kind === "file" && !file)}
                className="gap-1.5"
              >
                {status === "loading" && <Loader2 className="size-4 animate-spin" />}
                {activeSource.kind === "file" ? t("inventory.migrateImport") : t("inventory.migrateConnectImport")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
