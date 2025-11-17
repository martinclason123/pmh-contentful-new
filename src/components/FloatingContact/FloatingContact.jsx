import styles from "./floatingContact.module.css";
import { Phone, MessageCircle } from "lucide-react";
import Desktop from "./Desktop/Desktop";

const FloatingContact = () => {
  return (
    <>
      <Desktop />
      <footer
        className={`${styles.floatingBar}`}
        aria-label="Mobile contact options"
      >
        <a
          href="tel:+16169162278"
          className={styles.contactLink}
          aria-label="Call us"
        >
          <Phone className={styles.contactIcon} />
          <span>Call</span>
        </a>
        <a
          href="sms:+16169162278"
          className={styles.contactLink}
          aria-label="Text us"
        >
          <MessageCircle className={styles.contactIcon} />
          <span>Text</span>
        </a>
      </footer>
    </>
  );
};

export default FloatingContact;
