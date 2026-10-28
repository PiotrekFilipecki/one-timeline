// npm run shots <faza>  →  docs/media/<faza>/0N-<rozdział>-<szerokość>.png
import { execFileSync } from "node:child_process";

const phase = process.argv[2];
if (!phase || !/^[a-z0-9-]+$/i.test(phase)) {
  console.error("usage: npm run shots <phase>   e.g. npm run shots p0");
  process.exit(1);
}
execFileSync("npx", ["playwright", "test", "tests/shots", "--reporter=list", "--workers=2"], {
  stdio: "inherit",
  env: { ...process.env, SHOTS_PHASE: phase },
});
