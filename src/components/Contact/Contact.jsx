import styles from "./contact.module.css";
import { Form } from "../../app/subcomponents";

export default function Contact() {
  return (
    <section id="form" className={`container ${styles.contact}`}>
      <h2>Send us a Message</h2>
      <Form />
    </section>
  );
}
