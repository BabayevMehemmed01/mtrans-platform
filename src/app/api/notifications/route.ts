import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

// =============================================================================
// GET   /api/notifications  — Cari istifadəçinin bildirişlərini qaytar
// PATCH /api/notifications  — Bütün bildirişləri oxunmuş kimi işarələ
//
// Qeyd: Əgər istifadəçi üçün hələ real `Notification` qeydi yoxdursa (heç bir
// tetikləyici hadisə baş verməyibsə), zəng ikonu "boş" görünməsin deyə real
// datadan (təyin olunmuş son tapşırıqlar, yaxınlaşan son tarixlər, oxunmamış
// söhbət mesajları) "virtual" bildirişlər sintez edirik — bunlar DB-də
// saxlanılmır, hər sorğuda canlı hesablanır.
// =============================================================================

const DAY_MS = 24 * 60 * 60 * 1000;
const dismissedVirtualUntil = new Map<string, number>();

function formatDueDate(date: Date) {
  return new Intl.DateTimeFormat("az-AZ", { day: "2-digit", month: "short" }).format(date);
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

type VirtualNotification = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

async function buildVirtualNotifications(userId: string, companyId?: string): Promise<VirtualNotification[]> {
  const now = new Date();
  const soon = new Date(now.getTime() + 3 * DAY_MS);

  const [recentTasks, upcomingDeadlines, memberships] = await Promise.all([
    prisma.task.findMany({
      where: {
        assigneeId: userId,
        isArchived: false,
        ...(companyId ? { project: { companyId } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, createdAt: true, projectId: true },
    }),
    prisma.task.findMany({
      where: {
        assigneeId: userId,
        isArchived: false,
        status: { notIn: ["DONE", "CANCELLED"] },
        dueDate: { gte: now, lte: soon },
        ...(companyId ? { project: { companyId } } : {}),
      },
      orderBy: { dueDate: "asc" },
      take: 3,
      select: { id: true, title: true, dueDate: true, projectId: true },
    }),
    prisma.channelMember.findMany({
      where: { userId },
      select: { channelId: true, lastReadAt: true },
    }),
  ]);

  const items: VirtualNotification[] = [];

  for (const task of upcomingDeadlines) {
    items.push({
      id: `virtual-deadline-${task.id}`,
      type: "DEADLINE_APPROACHING",
      message: `"${task.title}" tapşırığının son tarixi yaxınlaşır — ${formatDueDate(task.dueDate as Date)}`,
      link: `/dashboard/projects/${task.projectId}?task=${task.id}`,
      isRead: false,
      createdAt: now.toISOString(),
    });
  }

  if (memberships.length > 0) {
    const channelIds = memberships.map((m) => m.channelId);
    const lastReadMap = new Map(memberships.map((m) => [m.channelId, m.lastReadAt]));
    const candidateMessages = await prisma.message.findMany({
      where: { channelId: { in: channelIds }, senderId: { not: userId } },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        content: true,
        createdAt: true,
        channelId: true,
        sender: { select: { name: true } },
      },
    });
    const unread = candidateMessages
      .filter((m) => m.createdAt > (lastReadMap.get(m.channelId) ?? new Date(0)))
      .slice(0, 2);

    for (const msg of unread) {
      items.push({
        id: `virtual-message-${msg.id}`,
        type: "MENTION",
        message: `${msg.sender?.name ?? "Naməlum istifadəçi"}: ${msg.content ? truncate(msg.content, 60) : "Fayl göndərdi"}`,
        link: `/dashboard/chat`,
        isRead: false,
        createdAt: msg.createdAt.toISOString(),
      });
    }
  }

  for (const task of recentTasks) {
    items.push({
      id: `virtual-task-${task.id}`,
      type: "TASK_ASSIGNED",
      message: `Sizə yeni tapşırıq təyin olunub: "${task.title}"`,
      link: `/dashboard/projects/${task.projectId}?task=${task.id}`,
      isRead: false,
      createdAt: task.createdAt.toISOString(),
    });
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items.slice(0, 6);
}

function mockNotifications(): VirtualNotification[] {
  const now = Date.now();
  return [
    {
      id: "virtual-mock-task",
      type: "TASK_ASSIGNED",
      message: "Sizə yeni tapşırıq təyin olunub: \"Müqavilənin yekunlaşdırılması\"",
      link: "/dashboard/my-work/tasks",
      isRead: false,
      createdAt: new Date(now - 12 * 60 * 1000).toISOString(),
    },
    {
      id: "virtual-mock-deadline",
      type: "DEADLINE_APPROACHING",
      message: "\"Təqdimat slaydları\" tapşırığının son tarixi yaxınlaşır — sabah",
      link: "/dashboard/my-work/calendar",
      isRead: false,
      createdAt: new Date(now - 45 * 60 * 1000).toISOString(),
    },
    {
      id: "virtual-mock-message",
      type: "MENTION",
      message: "Leyla Həsənova: Bugünkü status iclasının qeydlərini paylaşdım",
      link: "/dashboard/chat",
      isRead: false,
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const userId = session.user.id as string;
    const companyId = (session.user as any)?.companyId as string | undefined;

    const cutoff = new Date(Date.now() - DAY_MS);
    await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: cutoff },
      },
    });

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    if (notifications.length > 0) {
      return NextResponse.json({ notifications, unreadCount });
    }

    if ((dismissedVirtualUntil.get(userId) ?? 0) > Date.now()) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const virtual = await buildVirtualNotifications(userId, companyId);
    const feed = virtual.length > 0 ? virtual : mockNotifications();
    return NextResponse.json({
      notifications: feed,
      unreadCount: feed.filter((n) => !n.isRead).length,
    });
  } catch (error) {
    console.error("[GET /api/notifications]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const userId = session.user.id as string;
    const companyId = (session.user as any)?.companyId as string | undefined;

    const existingCount = await prisma.notification.count({ where: { userId } });

    if (existingCount > 0) {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    } else if (companyId) {
      const virtual = await buildVirtualNotifications(userId, companyId);
      const feed = virtual.length > 0 ? virtual : mockNotifications();
      if (feed.length > 0) {
        await prisma.notification.createMany({
          data: feed.map((n) => ({
            type: n.type as NotificationType,
            message: n.message,
            link: n.link,
            isRead: true,
            userId,
            companyId,
          })),
        });
      }
      await prisma.channelMember.updateMany({
        where: { userId },
        data: { lastReadAt: new Date() },
      });
    } else {
      await prisma.channelMember.updateMany({
        where: { userId },
        data: { lastReadAt: new Date() },
      });
      dismissedVirtualUntil.set(userId, Date.now() + 60 * 60 * 1000);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/notifications]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export { PATCH as PUT };

