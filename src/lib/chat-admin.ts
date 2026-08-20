import { isSuperAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type ChannelAdminSource = {
  type: "DIRECT" | "PROJECT" | "DEPARTMENT";
  project?: {
    ownerId: string;
    members?: { userId: string; role: string }[];
  } | null;
  department?: { headUserId: string | null } | null;
};

const channelAdminInclude = {
  project: {
    select: {
      ownerId: true,
      members: { select: { userId: true, role: true } },
    },
  },
  department: { select: { headUserId: true } },
} as const;

export function isGroupAdminSync(
  userId: string,
  channel: ChannelAdminSource,
  superAdmin = false
) {
  if (channel.type === "DIRECT") return false;
  if (superAdmin) return true;
  if (channel.type === "DEPARTMENT") {
    return channel.department?.headUserId === userId;
  }
  if (channel.project?.ownerId === userId) return true;
  const role = channel.project?.members?.find((m) => m.userId === userId)?.role;
  return role === "OWNER" || role === "MANAGER";
}

export async function loadChannelAdminContext(channelId: string) {
  return prisma.chatChannel.findUnique({
    where: { id: channelId },
    include: channelAdminInclude,
  });
}

export async function isChatGroupAdmin(userId: string, channelId: string) {
  const channel = await loadChannelAdminContext(channelId);
  if (!channel) return false;
  const superAdmin = await isSuperAdmin(userId);
  return isGroupAdminSync(userId, channel, superAdmin);
}

export async function canSendInChannel(userId: string, channelId: string) {
  const channel = await loadChannelAdminContext(channelId);
  if (!channel) return { ok: false as const, status: 404 };
  if (!channel.adminsOnly || channel.type === "DIRECT") {
    return { ok: true as const, channel };
  }
  const superAdmin = await isSuperAdmin(userId);
  if (isGroupAdminSync(userId, channel, superAdmin)) {
    return { ok: true as const, channel };
  }
  return { ok: false as const, status: 403, channel };
}
