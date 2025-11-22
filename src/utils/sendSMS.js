// export async function sendSMS({ name, mobile, message }) {

export async function sendSMS(name, mobile, message) {
  try {
    const res = await fetch("/api/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mobile, message }),
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("sendSMS error:", error);
    return { success: false, error };
  }
}
