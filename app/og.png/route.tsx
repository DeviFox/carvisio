import { seo } from "@/lib/i18n/messages/seo";
import { renderOg } from "@/lib/og-image";

// A route handler rather than the opengraph-image convention: static export
// writes the convention file without an extension (hosting may not serve it as
// image/png), and a child segment with its own openGraph loses it. Pages pick
// this up through ogBase() in lib/seo.ts; app/og-en.png is the English twin.
export const dynamic = "force-static";

export function GET() {
  return renderOg(seo.ru.og.title, seo.ru.og.subtitle);
}
