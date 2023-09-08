import engine from "./src/engine";
import FetchWebsite from "./src/plugins/FetchWebsite";

async function main() {
  // register plugins
  engine.registerPlugin(FetchWebsite)

  // run the cli
  await engine.run()
}

main();
