import * as readline from "node:readline/promises";
import { colors } from "./helpers/colors";
import OpenAI from "openai";
import { appendHistory, loadHistory, writeHistory } from "./helpers/history";
import { readSettings } from "./helpers/settings";
import { chat as chatAnthropic } from "./providers/anthropic";
import { chatDeepSeek } from "./providers/deepseek";
import { chatOpenai } from "./providers/openai";
import { chat as chatReplicate } from "./providers/replicate";

const EXIT_COMMANDS = ["exit", "quit", "q", "bye"];
const MAX_HISTORY = 500;

const inputHistory: string[] = loadHistory();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

function throwMissingEnv(envVar: string) {
  throw new Error(
    `${envVar} environment variable is not set. Please set it to use this feature.`,
  );
}

const NiceChat = {
  async run() {
    const settings = await readSettings();
    const args = process.argv.slice(2);

    const KNOWN_COMMANDS = ["list", "list-models", "help"];
    const command = KNOWN_COMMANDS.includes(args[0]) ? args[0] : "chat";

    if (command === "list") {
      await listProfiles(settings);
    } else if (command === "list-models") {
      if (!OPENAI_API_KEY) {
        return throwMissingEnv("OPENAI_API_KEY");
      }

      await listModels(OPENAI_API_KEY);
    } else if (command === "chat") {
      const profileName = args[0] || "default";
      const profile = settings.profiles[profileName];

      if (!profile) {
        throw new Error(
          `Profile ${profileName} not found. Possible values: ` +
            Object.keys(settings.profiles).join(", "),
        );
      }

      if (profile.vendor === "replicate") {
        if (!REPLICATE_API_KEY) {
          return throwMissingEnv("REPLICATE_API_KEY");
        }
        await chatReplicate(REPLICATE_API_KEY, profile.model, profile.system);
      } else if (profile.vendor === "anthropic") {
        if (!ANTHROPIC_API_KEY) {
          return throwMissingEnv("ANTHROPIC_API_KEY");
        }
        await chatAnthropic(ANTHROPIC_API_KEY, profile.model, profile.system);
      } else if (profile.vendor === "deepseek") {
        if (!DEEPSEEK_API_KEY) {
          return throwMissingEnv("DEEPSEEK_API_KEY");
        }
        await chatDeepSeek(DEEPSEEK_API_KEY, profile.model, profile.system);
      } else if (profile.vendor === "openai") {
        if (!OPENAI_API_KEY) {
          return throwMissingEnv("OPENAI_API_KEY");
        }
        await chatOpenai(OPENAI_API_KEY, profile.model, profile.system);
      } else if (profile.vendor === "openrouter") {
        if (!OPENROUTER_API_KEY) {
          return throwMissingEnv("OPENROUTER_API_KEY");
        }
        await chatOpenai(
          OPENROUTER_API_KEY,
          profile.model,
          profile.system,
          "https://openrouter.ai/api/v1",
        );
      } else {
        throw new Error("Unknown vendor: " + profile.vendor);
      }
    } else if (command === "help") {
      printHelp();
    } else {
      console.log("Unknown command: " + command);
    }
    process.exit(0);

    function printHelp() {
      console.log("Available commands:");
      const c = colors.bold;
      console.log("");
      console.log(
        `  ${c("[profile]")}        start chat with the assistant (default)`,
      );
      console.log("");
      console.log(`  ${c("list")}             list available profiles`);
      console.log(`  ${c("list-models")}      list available models`);
      console.log(`  ${c("help")}             show this help`);
    }

    async function listProfiles(
      settings: Awaited<ReturnType<typeof readSettings>>,
    ) {
      console.log(colors.bold("Available profiles:"));
      console.log("");

      const profileNames = Object.keys(settings.profiles);

      if (profileNames.length === 0) {
        console.log(colors.dim("  No profiles configured"));
        return;
      }

      for (const name of profileNames) {
        const profile = settings.profiles[name];
        console.log(
          `  ${colors.model(name.padEnd(15))} ${colors.dim(profile.vendor.padEnd(12))} ${colors.profileModel(profile.model)}`,
        );
      }
      console.log("");
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
    history: inputHistory,
  });

  const textUntrimmed = await rl.question(colors.prompt("> ") + "\x1b[95m");
  rl.close();
  process.stdout.write("\x1b[0m");

  const text = textUntrimmed.trim();

  if (EXIT_COMMANDS.includes(text)) {
    process.exit(0);
  }

  if (text && text !== inputHistory[inputHistory.length - 1]) {
    inputHistory.push(text);
    appendHistory(text);
    if (inputHistory.length > MAX_HISTORY) {
      inputHistory.splice(0, inputHistory.length - MAX_HISTORY);
      writeHistory(inputHistory);
    }
  }

  return text;
}

export default NiceChat;

export function logger(prefix: string) {
  return function log(msg: string) {
    console.log(`${colors.dim(prefix)} ${msg}`);
  };
}
