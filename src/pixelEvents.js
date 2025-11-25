export const fbTrack = (eventName, params = {}) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, params);
  } else {
    if (process.env.NODE_ENV === "development") {
      console.log("[fbTrack skipped]", eventName, params);
    }
  }
};

const SITE_NAME = "pmhpuppies.com";

export const handleDiscordOpen = () => {
  fbTrack("Contact", { method: "Discord Start", site: SITE_NAME });
};

export const handleDiscordMessage = () => {
  fbTrack("Contact", { method: "Discord Success", site: SITE_NAME });
};

export const handleCallClick = () => {
  fbTrack("Contact", { method: "Phone", site: SITE_NAME });
};

export const handleTextClick = () => {
  fbTrack("Lead", { method: "SMS", site: SITE_NAME });
};

export const trackContactForm = () => {
  fbTrack("Contact", { method: "Form", site: SITE_NAME });
};

export const trackConversion = (amount) => {
  fbTrack("Purchase", {
    value: amount,
    currency: "USD",
    site: SITE_NAME,
  });
};
