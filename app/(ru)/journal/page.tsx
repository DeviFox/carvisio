import LandingArticle from "@/components/landing-article";
import { landingMetadata } from "@/lib/seo";

export const metadata = landingMetadata("journal", "ru");

export default function Page() {
  return <LandingArticle page="journal" locale="ru" />;
}
