import Link from "next/link";
import styles from "./deposit.module.css";
import getPuppy from "../../../utils/get-puppy";

import { Agreement } from "../../subcomponents";

export default async function Deposit({ params }) {
  let match = await getPuppy(params.id);

  let stripeData = {
    name: match.name,
    price: match.price,
    chip: match.chip,
    breed: match.breed,
    buyer: match.buyer,
    buyerEmail: match.buyerEmail,
    buyerName: match.buyerName,
    buyerPhone: match.buyerPhone,
  };

  return (
    <section className={`container ${styles.deposit}`}>
      {match ? (
        <>
          <h1>$300 deposit on {match.name}</h1>
          <p>
            <strong>{`A 3.41% convenience fee will be added to the balance for using a card.`}</strong>{" "}
            You can avoid this fee by paying with cash, but no puppies will be
            reserved without a deposit.
          </p>
          <p>
            Deposits are considered non-refundable by default. Requests for
            refunds will be considered but are not guaranteed. By filling out
            this form and clicking continue, you agree to our deposit policy.
            Please ensure the information you provide is accurate, as it will be
            used to send you a confirmation and to contact you.
          </p>
          <Agreement deposit={true} puppy={stripeData} />
          <Link className={styles.back} href={`/puppies/${match.chip}`}>
            Back
          </Link>
        </>
      ) : (
        <p>No match found</p>
      )}
    </section>
  );
}
