export const dynamic = "force-dynamic";
import styles from "./litters.module.css";
import { Litters } from "../../components";

export const metadata = {
  title:
    "Current & Upcoming Litters | Bernedoodles, Goldendoodles, Cavapoos & Cavaliers - Paw Prints on My Heart",
  description:
    "View all current and upcoming litters at Paw Prints on My Heart. We offer Bernedoodles, Goldendoodles, Cavapoos, and Cavaliers. Subscribe to receive updates on your favorite litters.",
  openGraph: {
    title:
      "Current & Upcoming Litters | Bernedoodles, Goldendoodles, Cavapoos & Cavaliers - Paw Prints on My Heart",
    description:
      "View all current and upcoming litters at Paw Prints on My Heart. We offer Bernedoodles, Goldendoodles, Cavapoos, and Cavaliers. Subscribe to receive updates on your favorite litters.",
    url: "https://www.pmhpuppies.com/litters",
    type: "website",
    images: [
      {
        url: "https://www.pmhpuppies.com/assets/og/litters.jpg",
        width: 1200,
        height: 630,
        alt: "Puppies at Paw Prints on My Heart",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Current & Upcoming Litters | Bernedoodles, Goldendoodles, Cavapoos & Cavaliers - Paw Prints on My Heart",
    description:
      "View all current and upcoming litters at Paw Prints on My Heart. We offer Bernedoodles, Goldendoodles, Cavapoos, and Cavaliers. Subscribe to receive updates on your favorite litters.",
    images: ["https://www.pmhpuppies.com/assets/og/litters.jpg"],
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
