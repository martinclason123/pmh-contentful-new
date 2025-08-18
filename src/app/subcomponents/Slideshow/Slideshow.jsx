"use client";
import React, { useState, useEffect, useRef } from "react";
import Slider from "react-slick";
import { ResponsiveImage } from "../../../components";

import styles from "./slideshow.module.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function Slideshow({ name, images, breed }) {
  const [nav1, setNav1] = useState(null);
  const [nav2, setNav2] = useState(null);
  let sliderRef1 = useRef(null);
  let sliderRef2 = useRef(null);

  useEffect(() => {
    setNav1(sliderRef1);
    setNav2(sliderRef2);
  }, []);

  return (
    <section className={`container ${styles.slideshow}`}>
      <div className={`slider-container`}>
        <Slider asNavFor={nav2} ref={(slider) => (sliderRef1 = slider)}>
          {images.map((image, index) => {
            return (
              <div key={index}>
                <div className={styles.image_wrapper}>
                  <ResponsiveImage src={image} alt={`${breed} puppy`} />
                </div>
              </div>
            );
          })}
        </Slider>

        <Slider
          asNavFor={nav1}
          ref={(slider) => (sliderRef2 = slider)}
          slidesToShow={3}
          swipeToSlide={true}
          focusOnSelect={true}
          className={styles.mini}
        >
          {images.map((image, index) => {
            return (
              <div key={index}>
                <div className={styles.image_wrapper}>
                  <img src={image} alt="puppy" />
                </div>
              </div>
            );
          })}
        </Slider>
      </div>
    </section>
  );
}
