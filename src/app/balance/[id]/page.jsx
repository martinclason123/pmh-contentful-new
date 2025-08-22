export const dynamic = "force-dynamic";
import Link from "next/link";
import styles from "./balance.module.css";
import getPuppy from "../../../utils/get-puppy";

import { Agreement } from "../../subcomponents";

export default async function Balance({ params }) {
  let match = await getPuppy(params.id);
  let { price } = match;

  if (match.deposit) {
    price = price - 100;
  }

  let stripeData = {
    name: match.name,
    price: match.price,
    chip: match.chip,
    deposit: match.deposit,
    breed: match.breed,
    buyer: match.buyer,
    buyerEmail: match.buyerEmail,
    buyerName: match.buyerName,
    buyerPhone: match.buyerPhone,
  };

  return (
    <section className={`container ${styles.balance}`}>
      {match ? (
        <>
          <h1>
            ${price} balance payoff on {match.name}
          </h1>
          <p>
            <strong>{`A 3.41% convenience fee will be added to the balance for using a card.`}</strong>{" "}
            You can avoid this fee by paying with cash.
          </p>

          {match.buyer ? (
            <p>
              Purchases are considered non-refundable by default. Requests for
              refunds will be considered but are not guaranteed. By clicking
              continue, you agree to our purchase policy.
            </p>
          ) : (
            <p>
              Purchases are considered non-refundable by default. Requests for
              refunds will be considered but are not guaranteed. By filling out
              this form and clicking continue, you agree to our purchase policy.
              Please ensure the information you provide is accurate, as it will
              be used to send you a confirmation and to contact you.
            </p>
          )}
          <Agreement deposit={false} puppy={stripeData} />
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
