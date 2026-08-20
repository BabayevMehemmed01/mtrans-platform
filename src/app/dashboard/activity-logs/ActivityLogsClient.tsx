"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Download, ScrollText, Search } from "lucide-react";
import { getTranslation } from "@/lib/i18n";
import { describeAuditLog } from "@/lib/audit-labels";
import { cn, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuditAction, EntityType } from "@prisma/client";

const ACTIONS: AuditAction[] = [
  "LOGIN",
  "LOGOUT",
  "CREATE",
  "UPDATE",
  "DELETE",
  "INVITE",
  "ASSIGN",
  "COMPLETE",
  "ARCHIVE",
  "RESTORE",
];

const actionBadgeClass: Record<string, string> = {
  LOGIN: "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  LOGOUT: "border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  CREATE: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  UPDATE: "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  DELETE: "border-transparent bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  INVITE: "border-transparent bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  ASSIGN: "border-transparent bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  COMPLETE: "border-transparent bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
  ARCHIVE: "border-transparent bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  RESTORE: "border-transparent bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300",
};

type ActivityLogRow = {
  id: string;
  action: AuditAction;
  entityType: EntityType;
  entityName: string | null;
  ipAddress: string | null;
  sessionDurationMs: number | null;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null } | null;
};

type LogsResponse = {
  logs: ActivityLogRow[];
  total: number;
  page: number;
  limit: number;
};

function formatDuration(ms: number | null) {
  if (ms == null || ms < 0) return "—";
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

async function fetchLogs(params: URLSearchParams): Promise<LogsResponse> {
  const res = await fetch(`/api/activity-logs?${params.toString()}`);
  if (res.status === 403) throw new Error("FORBIDDEN");
  if (!res.ok) throw new Error("Failed to fetch logs");
  return res.json();
}

export function ActivityLogsClient() {
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const [q, setQ] = useState("");
  const [action, setAction] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (action !== "ALL") params.set("action", action);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("page", String(page));
    params.set("limit", "50");
    return params;
  }, [q, action, from, to, page]);

  const { data, isPending, isError } = useQuery({
    queryKey: ["activity-logs", queryParams.toString()],
    queryFn: () => fetchLogs(queryParams),
  });

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / 50));

  const actionLabel = (value: string) => {
    const translated = t(`activityLogs.actions.${value}`);
    if (translated && translated !== `activityLogs.actions.${value}`) return translated;
    return value;
  };

  const handleExport = async () => {
    const params = new URLSearchParams(queryParams);
    params.set("export", "1");
    params.delete("page");
    const result = await fetchLogs(params);
    const header = [
      t("activityLogs.colEmployee") || "İşçi",
      t("activityLogs.colAction") || "Fəaliyyət",
      t("activityLogs.colDetail") || "Detal",
      t("activityLogs.colIp") || "IP",
      t("activityLogs.colDate") || "Tarix",
      t("activityLogs.colDuration") || "Müddət",
    ];
    const rows = result.logs.map((log) => [
      log.user?.name ?? "",
      actionLabel(log.action),
      describeAuditLog(log),
      log.ipAddress ?? "",
      format(new Date(log.createdAt), "dd.MM.yyyy HH:mm"),
      formatDuration(log.sessionDurationMs),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => csvEscape(String(cell))).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <ScrollText className="size-5 text-muted-foreground" />
            {t("activityLogs.title") || "Fəaliyyət Jurnalı"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("activityLogs.desc") ||
              "İşçilərin giriş, çıxış və sistem əməliyyatlarının Super Admin jurnali."}
          </p>
        </div>
        <Button type="button" onClick={handleExport} disabled={logs.length === 0}>
          <Download className="size-4" />
          {t("activityLogs.export") || "Excel-ə Çıxart"}
        </Button>
      </div>

      <Card className="border-border bg-white shadow-sm ring-0 transition-all duration-300 hover:border-gray-300 hover:shadow-md dark:bg-card dark:hover:border-gray-700">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm">{t("activityLogs.filters") || "Filtrlər"}</CardTitle>
          <CardDescription>
            {t("activityLogs.filtersDesc") || "Ada, fəaliyyət növünə və tarix aralığına görə axtarın."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 px-4 pb-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder={t("activityLogs.searchPlaceholder") || "İşçi adı, detal, IP..."}
              className="pl-8"
            />
          </div>
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none dark:bg-input/30"
          >
            <option value="ALL">{t("activityLogs.allActions") || "Bütün fəaliyyətlər"}</option>
            {ACTIONS.map((item) => (
              <option key={item} value={item}>
                {actionLabel(item)}
              </option>
            ))}
          </select>
          <Input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </CardContent>
      </Card>

      <Card className="border-border bg-white shadow-sm ring-0 transition-all duration-300 hover:border-gray-300 hover:shadow-md dark:bg-card dark:hover:border-gray-700">
        <CardContent className="p-0">
          {isError ? (
            <p className="p-6 text-sm text-destructive">
              {t("activityLogs.fetchError") || "Jurnal yüklənərkən xəta baş verdi."}
            </p>
          ) : isPending ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("activityLogs.colEmployee") || "İşçi"}</TableHead>
                  <TableHead>{t("activityLogs.colAction") || "Fəaliyyət"}</TableHead>
                  <TableHead>{t("activityLogs.colDetail") || "Detal"}</TableHead>
                  <TableHead>{t("activityLogs.colIp") || "IP ünvanı"}</TableHead>
                  <TableHead>{t("activityLogs.colDate") || "Tarix/Saat"}</TableHead>
                  <TableHead>{t("activityLogs.colDuration") || "Müddət"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      {t("activityLogs.empty") || "Qeyd tapılmadı."}
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const name = log.user?.name ?? "—";
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar size="sm">
                              {log.user?.avatar ? (
                                <AvatarImage src={log.user.avatar} alt={name} />
                              ) : null}
                              <AvatarFallback className="text-[10px]">
                                {getInitials(name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("h-5 text-[10px]", actionBadgeClass[log.action])}>
                            {actionLabel(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                          {describeAuditLog(log)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {log.ipAddress || "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs tabular-nums">
                          {format(new Date(log.createdAt), "dd.MM.yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.action === "LOGOUT" ? formatDuration(log.sessionDurationMs) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {pageCount > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {total} {t("activityLogs.records") || "qeyd"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t("activityLogs.prev") || "Əvvəl"}
            </Button>
            <span>
              {page} / {pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              {t("activityLogs.next") || "Sonra"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
