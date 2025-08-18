import styles from "./litters.module.css";
import { Litter, LitterSlider } from "../../app/subcomponents";
import getLitters from "../../utils/get-litters";

export default async function Litters() {
  const litters = await getLitters();

  return (
    <section className={`container ${styles.litters}`}>
      <header>
        <h1>Our Litters</h1>
        <img src="/assets/litters/icon.svg" alt="dog icon" />
      </header>
      {/* <div className={styles.litters_wrapper}>
        {litters.map((litter) => (
          <Litter key={litter.id} litter={litter} />
        ))}
      </div> */}
      <LitterSlider litters={litters} />
    </section>
  );
}
