import LandingArticle from "@/components/landing-article";
import { landingMetadata } from "@/lib/seo";

export const metadata = landingMetadata("costs", "en");

export default function Page() {
  return <LandingArticle page="costs" locale="en" />;
}
