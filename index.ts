#!/usr/bin/env node

import NiceChat from "./src/nicechat";
import CurrentTime from "./src/plugins/CurrentTime";
import FetchWebsite from "./src/plugins/FetchWebsite";
import UrlOpener from "./src/plugins/UrlOpener";

async function main() {
  // register plugins
  NiceChat.registerPlugin(FetchWebsite);
  NiceChat.registerPlugin(CurrentTime);
  NiceChat.registerPlugin(UrlOpener);

  // run the cli
  await NiceChat.run();
}

main();
