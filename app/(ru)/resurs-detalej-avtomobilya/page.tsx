import LandingArticle from "@/components/landing-article";
import { landingMetadata } from "@/lib/seo";

export const metadata = landingMetadata("parts", "ru");

export default function Page() {
  return <LandingArticle page="parts" locale="ru" />;
}
