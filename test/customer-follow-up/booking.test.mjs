import { test } from "node:test";
import { schedulingCases } from "./support/scheduling-scenarios.mjs";
import { createSchedulingEnvironment } from "./support/scheduling-environment.mjs";
import { blockNetwork } from "./support/harness.mjs";
for (const scenario of schedulingCases) {
  test(`${scenario.id}: ${scenario.variant}`, async () => {
    const restore = blockNetwork();
    try {
      await scenario.run(createSchedulingEnvironment());
    } finally {
      restore();
    }
  });
}
