export const dynamic = "force-dynamic";
import styles from "./litter.module.css";
import { Subscribe } from "../../../components";
import { Gallery, Parents, Back } from "../../subcomponents";
import getPuppies from "../../../utils/get-puppies";
import getLitters from "../../../utils/get-litters";

const copy = {
  header: "follow this litter",
  subheader: "Subscribe to be notified of new photos, availability, and more!",
};

// Dynamic metadata function
export async function generateMetadata({ params }) {
  const litter = await getLitters(params.id);

  if (!litter) {
    return {
      title: "Litter Not Found - Prairie Creek Puppies",
      description:
        "We couldn't find the litter you were looking for. Please check out our available litters or contact us for more information.",
    };
  }

  return {
    title: `${litter.breed} Litter - Prairie Creek Puppies`,
    description: `${litter.message}`,
    openGraph: {
      title: `${litter.breed} Litter - Prairie Creek Puppies`,
      description: `${litter.message}`,
      url: `https://www.prairiecreekpuppies.com/litters/${params.id}`,
      type: "article",
      images: [
        {
          url: litter.hero,
          width: 1200,
          height: 630,
          alt: `Litter of ${litter.breed} puppies`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${litter.breed} Litter - Prairie Creek Puppies`,
      description: `${litter.message}`,
      images: [litter.hero],
    },
  };
}

export default async function Litter({ params }) {
  const litter = await getPuppies(params.id);
  const { parents, video } = await getLitters(params.id); // Retrieve the video ID
  const interests = [`${params.id}`];

  return (
    <section className={`container`}>
      <Subscribe copy={copy} interests={interests} mini={true} />
      <div className={styles.litter}>
        {video && (
          <div className={styles.videoWrapper}>
            <iframe
              src={`https://www.youtube.com/embed/${video}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Litter Video"
            ></iframe>
          </div>
        )}
        {litter.length === 0 ? (
          <div className={styles.no_results}>
            <img src={"/assets/litters/sniffing-dog.svg"} alt="dog sniffing" />
            <h2>
              No pictures of this litter yet! Be sure to subscribe, and we will
              let you know when the puppy details have been added!
            </h2>
          </div>
        ) : (
          <Gallery puppies={litter} back={`/litters/${params.id}`} />
        )}

        <Back />
        <Parents parents={parents} />
      </div>
    </section>
  );
}
