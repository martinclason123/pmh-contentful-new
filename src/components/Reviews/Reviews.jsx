"use client";
import Slider from "react-slick";
import styles from "./reviews.module.css";
import reviews from "../../data/reviews.json";
import { Star } from "lucide-react"; // Assuming you are using lucide-react
import "./slick-reviews.css";

export default function Reviews() {
  const settings = {
    infinite: false,
    // speed: 500,
    slidesToShow: 4, // Mobile first setting
    cssEase: "linear",
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 641, // Above 640px
        settings: {
          slidesToShow: 1.7, // Show 4 slides on desktop
        },
      },
    ],
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  return (
    <section className={`container ${styles.reviews} reviews-slider`}>
      <header className={styles.header}>
        <h2 className={styles.title}>What our customers say about us</h2>
      </header>
      <Slider {...settings} className={styles.slider}>
        {reviews.map((review, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.imageWrapper}>
              {review.image ? (
                <img
                  src={`/assets/reviews/people/${review.image}`}
                  alt={`${review.name} review`}
                  className={styles.reviewImage}
                />
              ) : (
                <div className={styles.initialPlaceholder}>
                  <span className={styles.initial}>
                    {getInitial(review.name)}
                  </span>
                </div>
              )}
            </div>
            <div className={styles.stars}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={styles.star} fill="#ffcc00" />
              ))}
            </div>
            <p className={styles.reviewText}>
              {review.review.length > 100
                ? `${review.review.substring(0, 100)}...`
                : review.review}
            </p>
            <a
              href="https://www.google.com/search?q=prairie+creek+puppies+sheridan+mi"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.googleLink}
            >
              Read full review on Google
            </a>
          </div>
        ))}
      </Slider>
    </section>
  );
}
