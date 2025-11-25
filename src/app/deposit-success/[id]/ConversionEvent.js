"use client";

import { trackConversion } from "../../../pixelEvents";

export default function ConversionEvent({ amount }) {
  // Fire once when the component mounts:
  React.useEffect(() => {
    trackConversion(amount);
  }, [amount]);

  return null; // renders nothing
}
