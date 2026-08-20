import type { Metadata } from "next";
import {
  generateProjectMetadata,
  ProjectDetailScreen,
} from "@/components/project/ProjectDetailScreen";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ task?: string; tab?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return generateProjectMetadata(id);
}

export default async function CollabDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { task, tab } = await searchParams;
  return <ProjectDetailScreen id={id} tab={tab} task={task} kind="collab" />;
}
