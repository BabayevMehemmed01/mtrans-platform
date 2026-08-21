export const kanbanTaskInclude = {
  assignee: { select: { id: true, name: true, avatar: true } },
  observers: { select: { id: true, name: true, avatar: true } },
  labels: { include: { label: true } },
  _count: { select: { subtasks: true, comments: true, attachments: true } },
} as const;
