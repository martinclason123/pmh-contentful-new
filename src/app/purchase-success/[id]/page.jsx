import Link from "next/link";

import getPuppy from "../../../utils/get-puppy";

import styles from "./success.module.css";
export default async function DepositSuccess({ params }) {
  let match = await getPuppy(params.id);

  return (
    <section className={`container ${styles.success}`}>
      {match ? (
        <h1>
          Congratulations! You have completed the purchase of {match.name}!
          Please{" "}
          <Link className={styles.link} href={"/#location"}>
            Contact Us
          </Link>{" "}
          to schedule a visit/pick-up. A confirmation email has been sent to
          you. If you did not receive the email, be sure to check your spam
          folder. Thank You!
        </h1>
      ) : (
        <>
          Something went wrong. Please call us at (616) 613-6801 if you are
          having trouble placing a deposit. Your money is safe.
        </>
      )}
    </section>
  );
}
