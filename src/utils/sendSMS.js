export async function sendSMS(name, mobile, message) {
  try {
    const res = await fetch("/api/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mobile, message }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success) {
      return {
        success: false,
        error: data?.error || "Request failed. Please try again.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("sendSMS error:", error);
    return { success: false, error: "Network error. Please try again." };
  }
}
