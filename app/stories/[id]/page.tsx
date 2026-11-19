import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE } from "@/components/news-frame";
import { StoryView } from "@/components/story-view";
import { SEED } from "@/lib/news";

type Search = { q?: string | string[]; beat?: string | string[] };
type Props = { params: Promise<{ id: string }>; searchParams?: Promise<Search> };
const first = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value) ?? "";
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
  if (!story) return {};
  // Each note shares as itself (layout.tsx sets the edition's Open Graph data).
  return {
    title: story.title,
    description: story.summary,
    alternates: { canonical: `/stories/${story.id}` },
    openGraph: { type: "article", url: `${SITE}/stories/${story.id}`, title: story.title, description: story.summary, siteName: "News Desk" },
    twitter: { card: "summary", title: story.title, description: story.summary },
  };
}

export default async function StoryPage(props: Props) {
  const story = await find(props);
  if (!story) notFound();
  const search = (await props.searchParams) ?? {};
  return <StoryView id={story.id} q={first(search.q).slice(0, 200)} beat={first(search.beat)} />;
}
