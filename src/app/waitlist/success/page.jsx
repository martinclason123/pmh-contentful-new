// src/app/waitlist/success/page.jsx
import Stripe from "stripe";
import Image from "next/image";
import styles from "../waitlist.module.scss";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function WaitlistSuccess({ searchParams }) {
  const sessionId = searchParams?.session_id;

  if (!sessionId) {
    return (
      <section className="container small">
        <div className={styles.successContainer}>
          <Image
            alt="dog waiting by the door"
            src="/assets/waitlist/waiting-d.jpg"
            height={1920}
            width={1200}
            className="sm-only"
          />
          <Image
            alt="dog waiting by the door"
            src="/assets/waitlist/waiting-d-b.jpg"
            height={600}
            width={1920}
            className="lg-only"
          />

          <div className={styles.successPane}>
            <p className={styles.successHeading}>Success</p>
            <p className={styles.successBody}>
              Missing session id. Please contact us if you believe this is an
              error.
            </p>
          </div>
        </div>
      </section>
    );
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error("[waitlist/success] failed to retrieve session:", err);

    return (
      <section className="container small">
        <div className={styles.successContainer}>
          <Image
            alt="dog waiting by the door"
            src="/assets/waitlist/waiting-d.jpg"
            height={1920}
            width={1200}
            className="sm-only"
          />
          <Image
            alt="dog waiting by the door"
            src="/assets/waitlist/waiting-d-b.jpg"
            height={600}
            width={1920}
            className="lg-only"
          />

          <div className={styles.successPane}>
            <p className={styles.successHeading}>We’re almost there</p>
            <p className={styles.successBody}>
              We couldn’t verify your checkout session yet. If you just
              completed payment, refresh in a moment. Otherwise, please contact
              us.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const name = session?.metadata?.name || "there";
  const breedName = session?.metadata?.breedName || "your selected breed";
  const code = session?.metadata?.code || null;

  return (
    <section className="container small">
      <div className={styles.successContainer}>
        <Image
          alt="dog waiting by the door"
          src="/assets/waitlist/wl-success-m.jpg"
          height={1280}
          width={1920}
          className="sm-only"
        />
        <Image
          alt="dog waiting by the door"
          src="/assets/waitlist/wl-success-d.jpg"
          height={600}
          width={1920}
          className="lg-only"
        />

        <div className={styles.successPane}>
          <h1 className={styles.successHeading}>Congratulations, {name}!</h1>

          <p className={styles.successBody}>
            You have joined the priority list for <strong>{breedName}</strong>.
            We emailed a confirmation. If you don’t see it, please check your
            spam folder.
          </p>

          <p className={styles.successBody} style={{ marginTop: "0.9em" }}>
            We will use your contact information to alert you about upcoming
            litters matching your preferences. If you have any questions, please
            do not hesitate to call us.
          </p>

          {code ? (
            <p className={styles.successBody} style={{ marginTop: "0.9em" }}>
              <strong>Your waitlist code:</strong> {code}
            </p>
          ) : null}

          <div className={styles.sectionDivider} aria-hidden="true" />

          <p className={styles.successBody}>
            Congratulations on taking this first step towards adding a furry
            member to your family!
          </p>
        </div>
      </div>
    </section>
  );
}
