import {
  runSeriesScenario,
  seriesCases,
} from "../test/customer-follow-up/support/series-scenarios.mjs";
import {
  runSchedulingScenario,
  schedulingCases,
} from "../test/customer-follow-up/support/scheduling-scenarios.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  implementedScenarios,
  runFoundationScenario,
} from "../test/customer-follow-up/support/scenarios.mjs";

try {
  const { values } = parseArgs({
    options: {
      scenario: { type: "string" },
      report: { type: "boolean", default: false },
      list: { type: "boolean", default: false },
      "expect-captures": { type: "string" },
    },
  });
  if (values.list) {
    process.stdout.write(
      `Implemented foundation scenarios: ${implementedScenarios.join(", ")}\nScheduling scenarios: ${[...new Set(schedulingCases.map((item) => item.id))].join(", ")}\nSeries configuration scenarios: ${seriesCases.map((item) => item.id).join(", ")}\nF01/F06 passed by joint review; full delivery journeys arrive in M4.\n`,
    );
  } else {
    const id = values.scenario ?? "F03";
    const expectedCaptures = Number(values["expect-captures"] ?? "1");
    if (!Number.isSafeInteger(expectedCaptures) || expectedCaptures < 0)
      throw new Error("Invalid expected capture count");
    const report = id.startsWith("X")
      ? await runSeriesScenario(id)
      : id.startsWith("S")
        ? await runSchedulingScenario(id)
        : await runFoundationScenario(id, { expectedCaptures });
    const json = `${JSON.stringify(report, null, 2)}\n`;
    process.stdout.write(json);
    if (
      values.report &&
      (implementedScenarios.includes(id) ||
        schedulingCases.some((item) => item.id === id) ||
        seriesCases.some((item) => item.id === id))
    ) {
      const directory = new URL("../.follow-up-reports/", import.meta.url);
      await mkdir(directory, { recursive: true });
      await writeFile(new URL(`${id}.json`, directory), json);
      process.stderr.write(`Report saved in ${fileURLToPath(directory)}\n`);
    }
    process.exitCode = report.status === "passed" ? 0 : 1;
  }
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
