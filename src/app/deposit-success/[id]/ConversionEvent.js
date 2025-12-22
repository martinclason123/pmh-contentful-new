"use client";
import { useEffect } from "react";
import { trackConversion } from "../../../pixelEvents";

export default function ConversionEvent({ amount }) {
  // Fire once when the component mounts:
  useEffect(() => {
    trackConversion(amount);
  }, [amount]);

  return null; // renders nothing
}
