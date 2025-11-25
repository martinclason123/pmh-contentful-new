import { GoogleAnalytics } from "@next/third-parties/google";
import { Inter } from "next/font/google";
import "./globals.css";
import { Footer, Navbar, Popup, FloatingContact } from "../components";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const Metadata = {
  metadataBase: new URL("https://pmhpuppies.com"),
  title: {
    default:
      "Paw Prints on My Heart | Cavalier King Charles Spaniel, Cavapoo, Goldendoodle & Bernedoodle Puppies in Michigan",
    template: "%s | Paw Prints on My Heart",
  },
  description:
    "Paw Prints on My Heart raises Cavalier King Charles Spaniel, Cavapoo, Goldendoodle, and Bernedoodle puppies in Sheridan, Michigan. Family-raised with care to help you find the perfect companion.",
  keywords: [
    "Puppies for sale",
    "Cavalier King Charles Spaniel puppies",
    "King Charles Cavalier puppies",
    "Cavapoo puppies",
    "Goldendoodle puppies",
    "Bernedoodle puppies",
    "Michigan puppies",
    "Sheridan MI puppies",
    "PMH Puppies",
    "Paw Prints on My Heart",
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
      "Paw Prints on My Heart | Cavalier, Cavapoo, Goldendoodle & Bernedoodle Puppies in Michigan",
    description:
      "Family-raised Cavalier King Charles Spaniel, Cavapoo, Goldendoodle, and Bernedoodle puppies in Sheridan, MI.",
    locale: "en_US",
    images: [
      {
        url: "https://pmhpuppies.com/assets/og/og-image-01.jpg",
        width: 1200,
        height: 630,
        alt: "Paw Prints on My Heart - Cavaliers, Cavapoos, Goldendoodles, & Bernedoodles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Paw Prints on My Heart | Cavaliers, Cavapoos, Goldendoodles & Bernedoodles in Michigan",
    description:
      "Paw Prints on My Heart raises Cavaliers, Cavapoos, Goldendoodles, and Bernedoodles in Sheridan, MI.",
    images: ["https://pmhpuppies.com/assets/og/og-image-01.jpg"],
  },
  viewport: "width=device-width, initial-scale=1",
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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script
          id="facebook-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '821905103011707');
      fbq('track', 'PageView', { site: 'pmhpuppies.com' });
    `,
          }}
        />
      </head>
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
        <FloatingContact />
        <Footer />
        <Popup />
      </body>
      <GoogleAnalytics gaId="G-E3KNSH4ZEN" />
    </html>
  );
}
