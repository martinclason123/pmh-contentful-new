export const dynamic = "force-dynamic";
import styles from "./litters.module.css";
import { Litters } from "../../components";

export const metadata = {
  title:
    "Current & Upcoming Litters | AKC Dachshunds, Golden Retrievers, & Shih Tzus - Peaceful Country Pets",
  description:
    "View all current and upcoming litters at Peaceful Country Pets. We offer AKC Dachshunds, Golden Retrievers, and Shih Tzus. Subscribe to receive updates on your favorite litters.",
  openGraph: {
    title:
      "Current & Upcoming Litters | AKC Dachshunds, Golden Retrievers, & Shih Tzus - Peaceful Country Pets",
    description:
      "View all current and upcoming litters at Peaceful Country Pets. We offer AKC Dachshunds, Golden Retrievers, and Shih Tzus. Subscribe to receive updates on your favorite litters.",
    url: "https://www.peacefulcountrypets.com/litters",
    type: "website",
    images: [
      {
        url: "https://www.peacefulcountrypets.com/assets/og/litters.jpg",
        width: 1200,
        height: 630,
        alt: "Puppies at Peaceful Country Pets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Current & Upcoming Litters | AKC Dachshunds, Golden Retrievers, & Shih Tzus - Peaceful Country Pets",
    description:
      "View all current and upcoming litters at Peaceful Country Pets. We offer AKC Dachshunds, Golden Retrievers, and Shih Tzus. Subscribe to receive updates on your favorite litters.",
    images: ["https://www.peacefulcountrypets.com/assets/og/litters.jpg"],
  },
};

export default async function LittersPage() {
  return (
    <section className={`container ${styles.litters}`}>
      <div className={styles.litters_wrapper}>
        <Litters />
      </div>
    </section>
  );
}
