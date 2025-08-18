"use client";
import { useState } from "react";
import styles from "./parents.module.css";
import { ResponsiveImage } from "../../../components";
import { Modal, ModalSlider, Ofa } from "../../../components";

export default function Parents({ name, parents }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [parentCertPhotos, setParentCertPhotos] = useState([]);
  const { dam, sire } = parents;

  const handleModalOpen = (parent) => {
    setModalOpen(true);
    setParentCertPhotos(parents[parent].certificationImages);
  };

  let message = "";

  if (!name) {
    message = " Meet the parents";
  } else {
    message = `${name}'s Parents`;
  }

  return (
    <>
      <Modal
        open={modalOpen}
        close={() => {
          setModalOpen(false);
        }}
      >
        <ModalSlider images={parentCertPhotos} />
      </Modal>

      <section className={styles.parents}>
        <h2>{message}</h2>
        <div className={styles.cards}>
          <div className={styles.card}>
            <ResponsiveImage src={dam.image} alt={`${dam.breed} female`} />
            <h3>
              Dam - {parents.dam.name}, {`${dam.weight} lbs`}
            </h3>

            {dam.certificationImages?.length > 0 && (
              <Ofa
                list={dam.ofa || []}
                callback={() => handleModalOpen("dam")}
              />
            )}
            <p>{parents.dam.description}</p>
          </div>
          <div className={styles.card}>
            <ResponsiveImage src={sire.image} alt={`${sire.breed} male`} />
            <h3>
              Sire - {parents.sire.name}, {`${sire.weight} lbs`}
            </h3>
            {sire.certificationImages?.length > 0 && (
              <Ofa
                list={sire.ofa || []}
                callback={() => handleModalOpen("sire")}
              />
            )}

            <p>{parents.sire.description}</p>
          </div>
        </div>
      </section>
    </>
  );
}
