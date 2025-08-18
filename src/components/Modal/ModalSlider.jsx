"use client";
import useEmblaCarousel from "embla-carousel-react";
import styles from "./modal.module.css";
import { ResponsiveImage } from "..";

const placeholderImages = [
  "https://via.placeholder.com/800x500?text=Image+1",
  "https://via.placeholder.com/800x500?text=Image+2",
  "https://via.placeholder.com/800x500?text=Image+3",
];

export default function ModalSlider({ images = [] }) {
  const [emblaRef] = useEmblaCarousel();
  const imageList = images.length > 0 ? images : placeholderImages;

  return (
    <div className={`${styles.sliderWrapper} embla`} ref={emblaRef}>
      <div className="embla__container">
        {imageList.map((src, i) => (
          <div key={i} className={`${styles.slide} embla__slide`}>
            <ResponsiveImage src={src} alt={`Slide ${i + 1}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
