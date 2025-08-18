"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "/node_modules/swiper/swiper-bundle.min.css";
import "./swiperOverrides.css";
import styles from "./littersSlider.module.css";
import Link from "next/link";
import { ResponsiveImage } from "../../../components";

export default function LitterSlider({ litters }) {
  const enoughSlides = litters.length > 4;

  return (
    <div id="litterSlider" className={styles.litterSlider}>
      <picture>
        <source
          srcSet="/assets/litters/litters-bg-m.avif?$staticlink$"
          type="image/avif"
          media="(max-width: 640px)"
          width="640"
          height="685"
        />
        <source
          srcSet="/assets/litters/litters-bg-m.webp?$staticlink$"
          type="image/webp"
          media="(max-width: 640px)"
          width="640"
          height="685"
        />
        <source
          srcSet="/assets/litters/litters-bg-m.jpg?$staticlink$"
          type="image/jpeg"
          media="(max-width: 640px)"
          width="640"
          height="685"
        />
        <source
          srcSet="/assets/litters/litters-bg-d.avif?$staticlink$"
          type="image/avif"
          media="(min-width: 641px)"
          width="1920"
          height="625"
        />
        <source
          srcSet="/assets/litters/litters-bg-d.webp?$staticlink$"
          type="image/webp"
          media="(min-width: 641px)"
          width="1920"
          height="625"
        />
        <img
          src="/assets/litters/litters-bg-d.jpg?$staticlink$"
          width="1920"
          height="625"
          loading="lazy"
          alt=""
        />
      </picture>
      <div className={styles.overlay}>
        <Swiper
          slidesPerView={"auto"} // Mobile first setting
          freeMode={true}
          freeModeMomentumRatio={0.1}
          freeModeMomentum={true}
          freeModeMomentumBounce={true}
          freeModeMomentumBounceRatio={0.1}
          freeModeMomentumVelocityRatio={1}
          freeModeSticky={true}
          freeModeMinimumVelocity={0.02}
          freemodemomentumduration={1000}
          pagination={{
            el: `#litterSlider .littersPag`, // Specify custom container
            type: "progressbar",
          }}
          modules={[Pagination, Navigation]}
          navigation={{
            nextEl: `#litterSlider .littersNext`, // Custom next button
            prevEl: `#litterSlider .littersPrev`, // Custom previous button
          }}
          breakpoints={{
            641: {
              slidesPerView: "auto", // Show 4 slides on screens 641px and up
              pagination: false,
            },
          }}
          className={`${styles.slider} ${enoughSlides ? null : "no-arrows"}`}
        >
          {litters.map((litter) => {
            const { breed, message, hero, id } = litter;
            const url = `/litters/${id}`;
            return (
              <SwiperSlide key={id}>
                <Link href={url} className={styles.card}>
                  <h2>{breed}</h2>
                  <ResponsiveImage
                    src={hero} // Dynamic URL from API
                    width="1920"
                    height="1351"
                    alt={`A group of ${breed} puppies`}
                    className={styles.litter_image}
                  />
                  <p>{message}</p>
                  <div className="cta">
                    <span className="cta-text">Details</span>
                  </div>
                </Link>
              </SwiperSlide>
            );
          })}
          <div className="pagination-wrapper">
            <div className="littersPag"></div>
          </div>
        </Swiper>
        {enoughSlides ? (
          <div className="nav-wrapper">
            <div className="littersPrev">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="feather feather-arrow-left"
              >
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </div>
            <div className="littersNext">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="feather feather-arrow-right"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
