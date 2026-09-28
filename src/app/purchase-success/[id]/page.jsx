import Link from "next/link";
import ConversionEvent from "./ConversionEvent";

import getPuppy from "../../../utils/get-puppy";
import getCheckoutPickupUrl from "../../../utils/get-checkout-pickup-url";
import {
  formatGoHomeDate,
  getPickupSchedulingUrl,
} from "../../../data/scheduling";

import styles from "./success.module.css";
export default async function PurchaseSuccess({ params, searchParams }) {
  let match = await getPuppy(params.id);
  const shouldOfferPickupScheduling = match && !match.pickupScheduled;
  const restrictedPickupUrl = shouldOfferPickupScheduling
    ? await getCheckoutPickupUrl(searchParams?.session_id, params.id)
    : null;
  const pickupUrl = shouldOfferPickupScheduling
    ? restrictedPickupUrl ||
      getPickupSchedulingUrl(match, {
        name: match.buyerName,
        email: match.buyerEmail,
      })
    : null;
  const goHomeDate = shouldOfferPickupScheduling
    ? formatGoHomeDate(match.available)
    : null;

  return (
    <section className={`container ${styles.success}`}>
      {match ? (
        <>
          <ConversionEvent amount={1200} />
          <h1>
            Congratulations! You have completed the purchase of {match.name}!
          </h1>
          <p>
            A confirmation email has been sent to you. If you did not receive
            it, please check your spam folder.
          </p>
          {shouldOfferPickupScheduling && (
            <p>
              Please{" "}
              <a
                className={styles.link}
                href={pickupUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                pick a time to come pick up {match.name}
              </a>{" "}
              on or after <strong>{goHomeDate}</strong>.
            </p>
          )}
          <p>
            If you have any questions, please{" "}
            <Link className={styles.link} href={"/#location"}>
              contact us
            </Link>
            . Thank you!
          </p>
        </>
      ) : (
        <>
          Something went wrong. Please call us at (616) 613-6801 if you are
          having trouble placing a deposit. Your money is safe.
        </>
      )}
    </section>
  );
}
