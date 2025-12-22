import WaitListForm from "../../components/WaitlistForm/WaitlistForm";
import Accordian from "../../components/Accordian/Accordian";
import faq from "./faqs.json";
import styles from "./waitlist.module.scss";
import { getWaitlists } from "../../utils";

export default async function Waitlist() {
  const waitlistData = await getWaitlists();

  return (
    <>
      <section className={`container small`}>
        <WaitListForm waitlistData={waitlistData} />
        <div id="faq" className={styles.accordianWrapper}>
          <h2>Waitlist FAQ</h2>
          <Accordian items={faq} />
        </div>
      </section>
    </>
  );
}
