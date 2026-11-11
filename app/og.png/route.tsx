import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// A route handler rather than the opengraph-image convention: static export
// writes the convention file without an extension (hosting may not serve it as
// image/png), and a child segment with its own openGraph loses it. Pages pick
// this up through OG_BASE in lib/seo.ts.
export const dynamic = "force-static";

const size = { width: 1200, height: 630 };

// The font bundled with next/og is Latin-only; Geist covers Cyrillic.
const fontDir = join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans");

export async function GET() {
  const [regular, semibold] = await Promise.all([
    readFile(join(fontDir, "Geist-Regular.ttf")),
    readFile(join(fontDir, "Geist-SemiBold.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#f8fafc",
          color: "#0f172a",
          fontFamily: "Geist Sans",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              width: 64,
              height: 64,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 18,
              background: "#0f172a",
              color: "#ffffff",
              fontSize: 36,
              fontWeight: 600,
            }}
          >
            c
          </div>
          <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.02em" }}>carvisio</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.04em" }}>
            Журнал обслуживания автомобиля
          </div>
          <div style={{ fontSize: 34, color: "#475569", lineHeight: 1.4 }}>
            Пробег, замены и ремонты, ресурс деталей — в одной истории
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 28, color: "#2563eb", fontWeight: 600 }}>
          carvisio.pro
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist Sans", data: regular, weight: 400, style: "normal" },
        { name: "Geist Sans", data: semibold, weight: 600, style: "normal" },
      ],
    },
  );
}
