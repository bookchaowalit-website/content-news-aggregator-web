import type { MetadataRoute } from "next";
import { SITE } from "@/components/news-frame";
import { SEED } from "@/lib/news";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE}/` }, ...SEED.map((story) => ({ url: `${SITE}/stories/${story.id}` }))];
}
