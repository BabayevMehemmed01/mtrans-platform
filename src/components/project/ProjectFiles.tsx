"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, FileIcon, ImageIcon, Loader2, Paperclip, Trash2, UploadCloud } from "lucide-react";
import { useSession } from "next-auth/react";
import { getTranslation } from "@/lib/i18n";
import { timeAgo } from "@/lib/utils";
import { uploadFiles } from "@/utils/uploadthing";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProjectFile = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  source?: "task" | "local";
  uploadedBy?: { name?: string | null } | null;
};

function formatFileSize(bytes: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function storageKey(projectId: string) {
  return `collab-project-files:${projectId}`;
}

export function ProjectFiles({ projectId }: { projectId: string }) {
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);
  const inputRef = useRef<HTMLInputElement>(null);

  const [taskFiles, setTaskFiles] = useState<ProjectFile[]>([]);
  const [localFiles, setLocalFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(projectId));
      if (raw) setLocalFiles(JSON.parse(raw));
    } catch {
      setLocalFiles([]);
    }
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/files`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setTaskFiles(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const persistLocal = (next: ProjectFile[]) => {
    setLocalFiles(next);
    try {
      localStorage.setItem(storageKey(projectId), JSON.stringify(next));
    } catch {
      /* ignore quota */
    }
  };

  const files = useMemo(() => {
    const merged = [...localFiles, ...taskFiles];
    const seen = new Set<string>();
    return merged.filter((file) => {
      const key = file.fileUrl || file.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [localFiles, taskFiles]);

  const handleUpload = useCallback(
    async (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);
      if (!incoming.length) return;
      setUploading(true);
      setError("");
      try {
        const uploaded = await uploadFiles("taskAttachment", { files: incoming });
        const next: ProjectFile[] = uploaded.map((file) => ({
          id: file.key,
          fileName: file.name,
          fileUrl: file.ufsUrl ?? file.url,
          fileType: file.type ?? "application/octet-stream",
          fileSize: file.size,
          createdAt: new Date().toISOString(),
          source: "local",
        }));
        persistLocal([...next, ...localFiles]);
      } catch (e: any) {
        setError(e?.message || (t("projectFiles.uploadError") || "Fayl yüklənmədi"));
      } finally {
        setUploading(false);
      }
    },
    [localFiles, t]
  );

  const removeLocal = (id: string) => {
    persistLocal(localFiles.filter((f) => f.id !== id));
  };

  return (
    <div className="h-full overflow-auto p-6 max-w-[1200px] mx-auto space-y-5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) handleUpload(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300 hover:bg-slate-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleUpload(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
        </div>
        <p className="text-sm font-bold text-slate-800">
          {uploading
            ? (t("projectFiles.uploading") || "Yüklənir...")
            : (t("projectFiles.dropTitle") || "Faylları bura sürüşdürün və ya seçin")}
        </p>
        <p className="mt-1 text-xs font-medium text-slate-500">
          {t("projectFiles.dropHint") || "PDF, şəkil və sənədlər dəstəklənir"}
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">⚠️ {error}</p>
      )}

      <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-800">
              {t("projectFiles.listTitle") || "Yüklənmiş fayllar"}
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {files.length}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : files.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <FileIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">{t("projectFiles.empty") || "Hələ heç bir fayl yoxdur"}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("projectFiles.colName") || "Ad"}</TableHead>
                <TableHead>{t("projectFiles.colSize") || "Ölçü"}</TableHead>
                <TableHead>{t("projectFiles.colDate") || "Tarix"}</TableHead>
                <TableHead className="text-right">{t("projectFiles.colActions") || "Əməliyyat"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => {
                const isImage = file.fileType?.startsWith("image/");
                return (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          {isImage ? (
                            <ImageIcon className="w-4 h-4 text-slate-500" />
                          ) : (
                            <FileIcon className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{file.fileName}</p>
                          {file.uploadedBy?.name && (
                            <p className="text-[11px] text-slate-400">{file.uploadedBy.name}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 font-medium">
                      {formatFileSize(file.fileSize)}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {timeAgo(file.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
                          title={t("projectFiles.download") || "Yüklə"}
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        {file.source === "local" && (
                          <button
                            type="button"
                            onClick={() => removeLocal(file.id)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500"
                            title={t("projectFiles.delete") || "Sil"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
