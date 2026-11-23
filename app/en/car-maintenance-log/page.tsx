import LandingArticle from "@/components/landing-article";
import { landingMetadata } from "@/lib/seo";

export const metadata = landingMetadata("journal", "en");

export default function Page() {
  return <LandingArticle page="journal" locale="en" />;
}
