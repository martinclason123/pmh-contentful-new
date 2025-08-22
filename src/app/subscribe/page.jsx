export const dynamic = "force-dynamic";
import { Subscribe } from "../../components";

export const metadata = {
  metadataBase: new URL("https://www.pmhpuppies.com"),
  title: "Subscribe for Updates | Paw Prints on My Heart",
  description:
    "Stay updated with the latest litters, blog posts, and news from Paw Prints on My Heart. Subscribe to receive alerts on Cavaliers, Cavapoos, Goldendoodles, and Mini Bernedoodles.",
  alternates: {
    canonical: "/subscribe",
  },
  openGraph: {
    title: "Subscribe for Updates | Paw Prints on My Heart",
    description:
      "Stay updated with the latest litters, blog posts, and news from Paw Prints on My Heart. Subscribe to receive alerts on Cavaliers, Cavapoos, Goldendoodles, and Mini Bernedoodles.",
    url: "/subscribe",
    type: "website",
    images: [
      {
        url: "/assets/og/subscribe.jpg",
        width: 1200,
        height: 630,
        alt: "Puppies at Paw Prints on My Heart",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Subscribe for Updates | Paw Prints on My Heart",
    description:
      "Stay updated with the latest litters, blog posts, and news from Paw Prints on My Heart. Subscribe to receive alerts on Cavaliers, Cavapoos, Goldendoodles, and Mini Bernedoodles.",
    images: ["/assets/og/subscribe.jpg"],
  },
};

export default async function Sub() {
  return (
    <section className={`container`}>
      <Subscribe interests={"General"} />
    </section>
  );
}
