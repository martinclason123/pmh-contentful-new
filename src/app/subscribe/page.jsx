export const dynamic = "force-dynamic";
import { Subscribe } from "../../components";

export const metadata = {
  title: "Subscribe for Updates | Peaceful Country Pets",
  description:
    "Stay updated with the latest litters, blog posts, and news from Peaceful Country Pets. Subscribe with your email to receive alerts on AKC Dachshunds, Golden Retrievers, and Shih Tzus.",
  openGraph: {
    title: "Subscribe for Updates | Peaceful Country Pets",
    description:
      "Stay updated with the latest litters, blog posts, and news from Peaceful Country Pets. Subscribe with your email to receive alerts on AKC Dachshunds, Golden Retrievers, and Shih Tzus.",
    url: "https://www.peacefulcountrypets.com/subscribe",
    type: "website",
    images: [
      {
        url: "https://www.peacefulcountrypets.com/assets/og/subscribe.jpg",
        width: 1200,
        height: 630,
        alt: "Puppies at Peaceful Country Pets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Subscribe for Updates | Peaceful Country Pets",
    description:
      "Stay updated with the latest litters, blog posts, and news from Peaceful Country Pets. Subscribe with your email to receive alerts on AKC Dachshunds, Golden Retrievers, and Shih Tzus.",
    images: ["https://www.peacefulcountrypets.com/assets/og/subscribe.png"],
  },
};

export default async function Sub() {
  return (
    <section className={`container`}>
      <Subscribe interests={"General"} />
    </section>
  );
}
