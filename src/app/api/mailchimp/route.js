import mailchimp from "@mailchimp/mailchimp_marketing";
import md5 from "md5";

export async function POST(req) {
  const data = await req.json();
  const { subscriber, interests } = data;
  const subscriberHash = md5(subscriber.toLowerCase());

  try {
    mailchimp.setConfig({
      apiKey: process.env.MAILCHIMP_API_KEY,
      server: "us21",
    });

    // Check if the user is already subscribed
    try {
      await mailchimp.lists.getListMember(
        process.env.MAILCHIMP_AUDIENCE_ID,
        subscriberHash
      );
      // If the user is found, update their tags
      const response = await mailchimp.lists.updateListMemberTags(
        process.env.MAILCHIMP_AUDIENCE_ID,
        subscriberHash,
        {
          tags: interests.map((interest) => ({
            name: interest,
            status: "active",
          })),
        }
      );
      return new Response(JSON.stringify(response), { status: 200 });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // If the user is not found, add them to the list
        const response = await mailchimp.lists.addListMember(
          process.env.MAILCHIMP_AUDIENCE_ID,
          {
            email_address: subscriber,
            status: "subscribed",
            tags: interests,
          }
        );
        return new Response(JSON.stringify(response), { status: 200 });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("Error: ", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
