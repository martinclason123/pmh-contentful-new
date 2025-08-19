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
  metadataBase: new URL("https://pmhpuppies.com"),
  title: {
    default:
      "Paw Prints on My Heart | Cavapoo, Goldendoodle, Bernedoodle & Cavalier Puppies in Michigan",
    template: "%s | Paw Prints on My Heart",
  },
  description:
    "Family-raised Cavapoo, Goldendoodle, Bernedoodle, and Cavalier King Charles Spaniel puppies in Sheridan, Michigan.",
  keywords: [
    "Cavapoo puppies",
    "Goldendoodle puppies",
    "Bernedoodle puppies",
    "Cavalier King Charles Spaniel puppies",
    "Sheridan MI puppies",
    "Michigan puppies",
  ],
  authors: [{ name: "Paw Prints on My Heart" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://pmhpuppies.com/",
    siteName: "Paw Prints on My Heart",
    title:
      "Paw Prints on My Heart | Cavapoo, Goldendoodle, Bernedoodle & Cavalier Puppies",
    description: "Ethically raised, well-socialized puppies in Sheridan, MI.",
    locale: "en_US",
    images: [
      {
        url: "https://pmhpuppies.com/assets/og/og-image-01.jpg",
        width: 1200,
        height: 630,
        alt: "Paw Prints on My Heart - Cavapoos, Goldendoodles, Bernedoodles & Cavaliers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Paw Prints on My Heart | Cavapoo, Goldendoodle, Bernedoodle & Cavalier Puppies",
    description: "Family-raised puppies in Sheridan, Michigan.",
    images: ["https://pmhpuppies.com/assets/og/og-image-01.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
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
