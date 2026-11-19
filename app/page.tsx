import { DeskView } from "@/components/desk-view";

type Search = { q?: string | string[]; beat?: string | string[] };
const first = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value) ?? "";

export default async function Home({ searchParams }: { searchParams?: Promise<Search> }) {
  const params = (await searchParams) ?? {};
  return <DeskView initialQuery={first(params.q).slice(0, 200)} initialBeat={first(params.beat)} />;
}
