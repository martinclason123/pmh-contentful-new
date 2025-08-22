export const dynamic = "force-dynamic";
import Link from "next/link";
import {
  Slideshow,
  Parents,
  Form,
  Back,
  Gallery,
  BreedInfo,
} from "../../subcomponents";
import styles from "./puppy.module.css";
import getPuppy from "../../../utils/get-puppy";
import getPuppies from "../../../utils/get-puppies";
import { ArrowRight } from "lucide-react"; // Added arrow icon from lucide-react

// Dynamic metadata function
export async function generateMetadata({ params }) {
  const match = await getPuppy(params.id);

  if (!match) {
    return {
      title: "Puppy Not Found - Prairie Creek Puppies",
      description:
        "We couldn't find the puppy you were looking for. Please check out our available puppies or contact us for more information.",
    };
  }

  return {
    title: `${match.name} | ${match.breed} Puppy - Prairie Creek Puppies`,
    description: `${match.name} is an adorable ${match.breed} puppy. ${match.description}`,
    openGraph: {
      title: `${match.name} | ${match.breed} Puppy - Prairie Creek Puppies`,
      description: `${match.name} is an adorable ${match.breed} puppy. ${match.description}`,
      url: `https://www.prairiecreekpuppies.com/puppies/${params.id}`,
      type: "article",
      images: [
        {
          url: match.hero,
          width: 1200,
          height: 630,
          alt: `${match.name} the ${match.breed} Puppy`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${match.name} | ${match.breed} Puppy - Prairie Creek Puppies`,
      description: `${match.name} is an adorable ${match.breed} puppy. ${match.description}`,
      images: [match.hero],
    },
  };
}

export default async function Puppy({ params }) {
  let match = await getPuppy(params.id);
  console.log("params", params.id);

  let litterMates = await getPuppies(match.litter);
  const breed = litterMates[0].breed[0];
  litterMates = litterMates.filter((puppy) => puppy.chip !== match.chip);

  const available = match.availability === "Available";
  const reserved = match.availability === "Reserved";

  return (
    <section className={`container`}>
      {match ? (
        <>
          <div className={styles.puppy}>
            <section className={styles.hero}>
              <div className={styles.slideshow}>
                <Slideshow
                  name={match.name}
                  images={[match.hero, ...match.gallery]}
                  breed={match.breed}
                />
              </div>
              <div className={styles.details}>
                <div className={styles.actions}>
                  <div className={styles.attributes}>
                    <ul>
                      <li>
                        <span>✔</span> Vet checked
                      </li>
                      <li>
                        <span>✔</span> Health guarantee
                      </li>
                      <li>
                        <span>✔</span> Dewormed
                      </li>
                      <li>
                        <span>✔</span> Microchipped
                      </li>
                      <li>
                        <span>✔</span> Vaccinated
                      </li>
                    </ul>
                    <h2>{`$${match.price}`}</h2>
                  </div>
                  {available ? (
                    <div className={styles.links}>
                      <a href="#form" className={`${styles.cta} ${styles.ask}`}>
                        <span>Ask About Me</span>
                      </a>
                      <Link
                        href={`/deposit/${match.chip}`}
                        className={`${styles.cta} ${styles.reserve}`}
                      >
                        <span>Reserve Me</span>
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <h2 className={styles.availability}>
                        {match.availability} 💖
                      </h2>
                      {reserved ? (
                        <Link
                          href={`/balance/${match.chip}`}
                          className={`${styles.cta} ${styles.balance}`}
                        >
                          <span>Pay Balance</span>
                        </Link>
                      ) : null}
                    </div>
                  )}
                </div>
                <section className={styles.description}>
                  <ul>
                    <li>
                      <strong>{match.name}</strong> - {match.breed}
                    </li>
                    <li>
                      <strong className={styles.capitalize}>
                        {match.gender}
                      </strong>{" "}
                      - Born {match.birthdate}
                    </li>
                    <li>
                      <strong>Ready for adoption</strong> - {match.available}
                    </li>
                  </ul>
                  <p>{match.description}</p>
                </section>
              </div>
            </section>
            <Back />
            {match.parents ? (
              <Parents name={match.name} parents={match.parents} />
            ) : null}
            <div className={styles.litterMates}>
              <h2
                className={styles.heading}
              >{`${match.name}'s Litter Mates`}</h2>
              <Gallery puppies={litterMates.slice(0, 4)} fullWidth={false} />
              <Link
                className={styles.viewAll}
                href={`/litters/${match.litter}`}
              >
                {`< View All Litter mates`}
              </Link>
            </div>
            <BreedInfo breed={breed} modifiers={"small"} />;
            <div className={styles.form_wrapper} id="form">
              <h2>Have a question about {match.name}?</h2>
              <p>
                Submit a message below and we will get right back to you. You
                can also reach us on{" "}
                <a
                  target="_blank"
                  href="https://www.facebook.com/profile.php?id=61561863522481"
                >
                  Facebook
                </a>{" "}
                or call or text us at{" "}
                <a href="tel:+16166136801">(616) 613-6801</a>
              </p>
              <Form subject={`Inquiry about ${match.name}`} />
            </div>
          </div>
        </>
      ) : (
        <p>Uh-oh, no puppy with that id was found</p>
      )}
    </section>
  );
}
