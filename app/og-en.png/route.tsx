import { seo } from "@/lib/i18n/messages/seo";
import { renderOg } from "@/lib/og-image";

// English Open Graph image for the /en/ pages; see app/og.png.
export const dynamic = "force-static";

export function GET() {
  return renderOg(seo.en.og.title, seo.en.og.subtitle);
}
