"use client";

import useSWR from "swr";
import { format } from "date-fns";
import { CheckCircle2, Clock, MessageSquare, AlertCircle, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { MyWorkTrendChart } from "@/components/dashboard/MyWorkTrendChart";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function MyWorkClient({ currentUser }: { currentUser: any }) {
  const { data, error, mutate } = useSWR("/api/my-work", fetcher, { refreshInterval: 10000 });

  if (error) return <div className="p-6 text-red-500">Məlumatları yükləyərkən xəta baş verdi.</div>;
  if (!data) return <div className="p-6 flex justify-center mt-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  const { tasks, recentComments, stats, weeklyCompleted } = data;

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    // Optimistic update
    mutate((prev: any) => ({
      ...prev,
      tasks: prev.tasks.map((t: any) => t.id === taskId ? { ...t, status: newStatus } : t)
    }), false);

    await fetch("/api/my-work", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status: newStatus })
    });
    mutate();
  };

  const statusColors: any = {
    BACKLOG: "bg-gray-100 text-gray-700",
    TODO: "bg-slate-100 text-slate-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    IN_REVIEW: "bg-purple-100 text-purple-700",
    DONE: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700"
  };

  const statusLabels: any = {
    BACKLOG: "Toplu",
    TODO: "Gözləyir",
    IN_PROGRESS: "İcra edilir",
    IN_REVIEW: "Yoxlanışda",
    DONE: "Tamamlandı",
    CANCELLED: "Ləğv edildi"
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cəmi Tapşırıq</p>
              <h3 className="text-2xl font-bold mt-1">{stats.total}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tamamlanan</p>
              <h3 className="text-2xl font-bold mt-1 text-green-600">{stats.completed}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Yaxınlaşan (3 gün)</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-600">{stats.upcoming}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-white border shadow-sm ${stats.overdue > 0 ? 'border-red-200 bg-red-50/50' : ''}`}>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gecikən</p>
              <h3 className="text-2xl font-bold mt-1 text-red-600">{stats.overdue}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Completed Trend */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle>Son 7 Gün — Tamamladığım Tapşırıqlar</CardTitle>
          <CardDescription>Gün üzrə tamamladığınız tapşırıqların sayı.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <MyWorkTrendChart data={weeklyCompleted ?? []} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Task List */}
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle>Aktiv Tapşırıqlarım</CardTitle>
            <CardDescription>Sizə təyin edilmiş və icrasını gözləyən tapşırıqlar.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {tasks.filter((t: any) => t.status !== "DONE" && t.status !== "CANCELLED").length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Bütün işləri bitirmisiniz! 🎉
                </div>
              ) : (
                <div className="divide-y">
                  {tasks.filter((t: any) => t.status !== "DONE" && t.status !== "CANCELLED").map((task: any) => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                    
                    return (
                      <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{task.project.name}</span>
                            {task.labels?.map((tl: any) => (
                              <Badge key={tl.label.id} variant="outline" className="text-[10px] px-1 py-0 h-4" style={{ borderColor: tl.label.color, color: tl.label.color }}>
                                {tl.label.name}
                              </Badge>
                            ))}
                          </div>
                          <Link href={`/dashboard/projects/${task.project.id}`} className="font-medium text-slate-900 hover:text-blue-600 truncate block">
                            {task.title}
                          </Link>
                          {task.dueDate && (
                            <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                              <Calendar className="w-3.5 h-3.5" />
                              {format(new Date(task.dueDate), "dd MMM yyyy")}
                              {isOverdue && <span className="ml-1 bg-red-100 text-red-700 px-1.5 py-0.5 rounded-sm">Gecikir</span>}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-shrink-0 w-36">
                           <Select value={task.status} onValueChange={(val) => handleStatusChange(task.id, val)}>
                              <SelectTrigger className={`h-8 text-xs font-medium border-0 ${statusColors[task.status]}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BACKLOG">Toplu</SelectItem>
                                <SelectItem value="TODO">Gözləyir</SelectItem>
                                <SelectItem value="IN_PROGRESS">İcra edilir</SelectItem>
                                <SelectItem value="IN_REVIEW">Yoxlanışda</SelectItem>
                                <SelectItem value="DONE">Tamamlandı</SelectItem>
                                <SelectItem value="CANCELLED">Ləğv edildi</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Activity / Mentions */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle>Son Rəylər</CardTitle>
            <CardDescription>Sizin tapşırıqlara yazılan şərhlər.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
               {recentComments.length === 0 ? (
                 <div className="p-8 text-center text-muted-foreground text-sm">
                   Yaxın zamanda rəy yoxdur.
                 </div>
               ) : (
                 <div className="divide-y">
                   {recentComments.map((comment: any) => (
                     <div key={comment.id} className="p-4 hover:bg-slate-50 transition-colors">
                       <div className="flex gap-3">
                          <Avatar className="w-8 h-8 mt-0.5">
                            <AvatarImage src={comment.author.avatar} />
                            <AvatarFallback className="bg-slate-100 text-xs">
                              {comment.author.name.substring(0,2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between mb-0.5">
                                <span className="text-sm font-medium text-slate-900">{comment.author.name}</span>
                                <span className="text-[10px] text-slate-500">{format(new Date(comment.createdAt), "dd MMM, HH:mm")}</span>
                             </div>
                             <p className="text-xs text-slate-600 font-medium mb-1 truncate">
                               Tapşırıq: {comment.task.title}
                             </p>
                             <div className="text-sm text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-100">
                               {comment.content}
                             </div>
                          </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
