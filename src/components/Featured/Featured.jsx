import Link from "next/link";
import styles from "./featured.module.css";
import getPuppies from "../../utils/get-puppies";

import { Gallery } from "../../app/subcomponents";

export default async function Featured({ limiter }) {
  let puppies = await getPuppies();

  return (
    <section className={`container`}>
      <div className={styles.featured}>
        <h2>Featured Puppies</h2>
        <Gallery puppies={puppies.slice(0, 4)} modifiers={"medium"} />
        <Link href={"/puppies"} className={styles.cta}>
          <span className={styles.cta_text}>See All Puppies</span>
        </Link>
      </div>
    </section>
  );
}
