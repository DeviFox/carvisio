import type { Metadata } from "next";
import { OG_BASE } from "@/lib/seo";
import HomeClient from "./home-client";

// The garage itself is a client component; this server wrapper exists so the
// home page can own its canonical and og:url instead of the root layout, which
// every other route would inherit.
const TITLE = "carvisio — ваш гараж онлайн: история обслуживания и ресурс деталей";
const DESCRIPTION =
  "Ведите историю обслуживания своих автомобилей: пробег, замены и ремонты, ресурс установленных деталей и состояние систем. Можно начать без регистрации.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { ...OG_BASE, title: TITLE, description: DESCRIPTION, url: "/" },
};

export default function Page() {
  return <HomeClient />;
}
