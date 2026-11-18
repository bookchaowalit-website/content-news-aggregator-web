import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoryView } from "@/components/story-view";
import { SEED } from "@/lib/news";

type Props = { params: Promise<{ id: string }> };
export const dynamicParams = false;

const find = async ({ params }: Props) => {
  const { id } = await params;
  return SEED.find((story) => story.id === id);
};

export function generateStaticParams() {
  return SEED.map((story) => ({ id: story.id }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const story = await find(props);
  return story ? { title: story.title, description: story.summary, alternates: { canonical: `/stories/${story.id}` } } : {};
}

export default async function StoryPage(props: Props) {
  const story = await find(props);
  if (!story) notFound();
  return <StoryView id={story.id} />;
}
