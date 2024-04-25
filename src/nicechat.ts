import chalk from "chalk";
import * as readline from "node:readline/promises";
import { chat as chatAnthropic } from "./anthropic";
import { chat as chatReplicate } from "./replicate";
import { readSettings } from "./helpers/settings";
import { chatOpenai } from "./openai";
import { ChatPlugin } from "./plugins/ChatPlugin";
import OpenAI from "openai";

const EXIT_COMMANDS = ["exit", "quit", "q", "bye"];

const NiceChat = {
  plugins: new Map<string, ChatPlugin>(),

  registerPlugin(p: ChatPlugin) {
    NiceChat.plugins.set(p.meta.name, p);
  },

  async run() {
    const settings = await readSettings();
    const args = process.argv.slice(2);

    const command = !args[0] || args[0].startsWith("--") ? "chat" : args[0];

    if (command === "list-models") {
      await listModels(settings.openai_key);
    } else if (command === "chat") {
      const profileName = args[1] || "default";
      const profile = settings.profiles[profileName];

      if (!profile) {
        throw new Error(
          `Profile ${profileName} not found. Possible values: ` +
            Object.keys(settings.profiles).join(", ")
        );
      }

      if (profile.vendor === "replicate") {
        await chatReplicate(
          settings.replicate_key,
          profile.model,
          profile.system
        );
      } else if (profile.vendor === "anthropic") {
        await chatAnthropic(
          settings.anthropic_key,
          profile.model,
          profile.system
        );
      } else if (profile.vendor === "openai") {
        const isDebug = args.some((x) => x === "--debug");
        await chatOpenai(
          settings.openai_key,
          profile.model,
          profile.system,
          isDebug,
          NiceChat.plugins
        );
      } else {
        throw new Error("Unknown vendor: " + profile.vendor);
      }
    } else if (command === "run-plugin") {
      const pluginName = args[1];
      const plugin = NiceChat.plugins.get(pluginName);
      if (!plugin) {
        throw new Error("Unregistered plugin: " + pluginName);
      }
      const toolkit = {
        log: logger(`[${plugin.meta.name}]`),
        debug: logger(`[${plugin.meta.name}]`),
      };
      const result = await plugin.execute(args[2], { toolkit });
      console.log(result);
    } else if (command === "help") {
      printHelp();
    } else {
      console.log("Unknown command: " + command);
    }
    process.exit(0);

    function printHelp() {
      console.log("Available commands:");
      const c = chalk.bold;
      console.log("");
      console.log(
        `  ${c(
          "chat [profile] [--debug]"
        )}   start chat with the assistant (default)`
      );
      console.log("");
      console.log(`  ${c("list-models")}      list available models`);
      console.log(`  ${c("help")}             show this help`);
    }

    async function listModels(apiKey: string) {
      const openai = new OpenAI({ apiKey });
      let models = null;
      while (models === null || models.hasNextPage()) {
        models = await openai.models.list();
        for (let m of models.data) {
          console.log(m.id);
        }
      }
    }
  },
};

export async function readLine() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const textUntrimmed = await rl.question(chalk.yellow("> "));
  rl.close();

  const text = textUntrimmed.trim();

  if (EXIT_COMMANDS.includes(text)) {
    process.exit(0);
  }
  return text;
}

export default NiceChat;

export function logger(prefix: string) {
  return function log(msg: string) {
    console.log(`${chalk.blueBright(prefix)} ${msg}`);
  };
}
