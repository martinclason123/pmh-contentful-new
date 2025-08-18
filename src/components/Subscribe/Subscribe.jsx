import styles from "./subscribe.module.css";
import { Mailchimp } from "../../app/subcomponents";

export default function Subscribe({
  interests = ["General"],
  copy = {
    header: "Subscribe to our newsletter",
    subheader: `Our puppies find homes quickly. Subscribe for alerts on upcoming
              litters and be first to know when new puppies become available.`,
  },
  mini = false,
  noPuppies,
}) {
  let message;
  let classMods = "";

  if (noPuppies === true || process.env.PUPPIES_ARE_AVAILABLE === "false") {
    message = "No puppies available right now";
  } else {
    message = copy.header;
  }

  if (mini) {
    classMods = styles.mini;
  }

  return (
    <section className={`container ${styles.subscribe} ${classMods}`}>
      <picture>
        <source
          srcset="/assets/subscribe/subscribe-bg-m.svg?$staticlink$"
          media="(max-width: 640px)"
          width="655"
          height="1057"
        />
        <img
          src="/assets/subscribe/subscribe-bg-d.svg?$staticlink$"
          width="1920"
          height="249"
          loading="lazy"
          alt=""
        />
      </picture>
      <div className={styles.overlay}>
        <div className={styles.content}>
          <div className={styles.copy}>
            <h2>{message}</h2>
            <p>{copy.subheader}</p>
          </div>
          <div className={styles.form}>
            <Mailchimp interests={interests} />
          </div>
        </div>
      </div>
    </section>
  );
}
