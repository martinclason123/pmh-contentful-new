import {
  Hero,
  Options,
  Location,
  Reasons,
  Featured,
  Contact,
  Subscribe,
  Litters,
  Breeds,
  Socials,
  About,
  Reviews,
} from "../components";

export const metadata = {
  title:
    "Peaceful Country Pets | AKC Dachshunds, Golden Retrievers, & Shih Tzus",
  description:
    "Peaceful Country Pets offers high-quality AKC Dachshunds, Golden Retrievers, and Shih Tzus, raised with love and care in Sheridan, MI. Find your perfect companion today.",
  keywords:
    "Puppies for sale, Dachshunds, Golden Retrievers, Shih Tzus, AKC puppies, Sheridan MI",
  author: "Peaceful Country Pets",
  openGraph: {
    title:
      "Peaceful Country Pets | AKC Dachshunds, Golden Retrievers, & Shih Tzus",
    description:
      "Peaceful Country Pets offers high-quality AKC Dachshunds, Golden Retrievers, and Shih Tzus, raised with love and care in Sheridan, MI. Find your perfect companion today.",
    url: "https://www.peacefulcountrypets.com/",
    type: "website",
    images: [
      {
        url: "https://www.peacefulcountrypets.com/assets/og/og-image-01.jpg",
        width: 1200,
        height: 630,
        alt: "Peaceful Country Pets - Dachshunds, Golden Retrievers, & Shih Tzus",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Peaceful Country Pets | AKC Dachshunds, Golden Retrievers, & Shih Tzus",
    description:
      "Peaceful Country Pets offers high-quality AKC Dachshunds, Golden Retrievers, and Shih Tzus, raised with love and care in Sheridan, MI. Find your perfect companion today.",
    images: ["https://www.peacefulcountrypets.com/assets/og/og-image-01.jpg"],
  },
  viewport: "width=device-width, initial-scale=1",
  charset: "UTF-8",
  language: "English",
};

export default function Home() {
  return (
    <main>
      <Hero />
      <Options />
      <Breeds />
      <Litters />
      <Featured limiter={4} />
      <About />
      {/* <Reviews /> */}
      <Socials />
      <Reasons />
      <Location />
      <Contact />
      <Subscribe />
    </main>
  );
}
