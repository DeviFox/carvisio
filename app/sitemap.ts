import type { MetadataRoute } from "next";
import { LOCALIZED_PATHS } from "@/lib/i18n/core";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

const PAGES = [
  { page: "home", changeFrequency: "weekly", priority: 1 },
  { page: "journal", changeFrequency: "monthly", priority: 0.8 },
  { page: "costs", changeFrequency: "monthly", priority: 0.8 },
  { page: "parts", changeFrequency: "monthly", priority: 0.8 },
] as const;

// Every language's URL is listed, each carrying the full set of hreflang alternates.
export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap(({ page, changeFrequency, priority }) => {
    const paths = LOCALIZED_PATHS[page];
    const languages = Object.fromEntries(Object.entries(paths).map(([l, p]) => [l, `${SITE_URL}${p}`]));
    return Object.values(paths).map((p) => ({
      url: `${SITE_URL}${p}`,
      changeFrequency,
      priority,
      alternates: { languages },
    }));
  });
}
