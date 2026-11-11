import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { notFound } from "next/navigation";
import { localDepositTest, readTestPuppy } from "../../../utils/local-deposit-test";

export const dynamic = "force-dynamic";

export default async function LocalPickup({ searchParams }) {
  if (!localDepositTest()) notFound();

  const puppy = await readTestPuppy();
  if (!puppy.deposit) {
    return (
      <section className="container">
        <h1>Test pickup</h1>
        <p>The local Stripe webhook has not recorded the deposit yet. Refresh this page once checkout finishes.</p>
      </section>
    );
  }

  let schedule;
  if (searchParams?.simulate === "1") {
    const { stdout } = await promisify(execFile)(
      process.execPath,
      ["scripts/simulate-follow-up.mjs", "--scenario", "S01"],
      { env: {}, timeout: 10000 },
    );
    schedule = JSON.parse(stdout).variants[0].messages;
  }

  return (
    <section className="container">
      <h1>Test pickup for {puppy.name}</h1>
      <p>Stripe recorded the deposit. The local puppy is reserved.</p>
      <p>Run a simulated Calendly booking to see which follow-up emails would be scheduled.</p>
      <form>
        <button name="simulate" value="1">Simulate pickup booking</button>
      </form>
      {schedule && (
        <>
          <h2>Pending follow-up emails for the sample booking</h2>
          <ul>
            {schedule.map(({ stage, dueAt, state }) => (
              <li key={stage}>{stage}: {dueAt} ({state})</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
