import chalk from "chalk";
import fs from "fs";
import * as readline from "node:readline/promises";
import OpenAI from "openai";
import path from "path";
import { ChatPlugin } from "./plugins/ChatPlugin";

const SETTINGS_FILE_NAME = ".nicechat.json";
const EXIT_COMMANDS = ["exit", "quit", "q", "bye"];

type Settings = {
  model: string;
  openai_key: string;
  system: string;
};

const engine = {
  plugins: {} as Record<string, ChatPlugin>,

  registerPlugin(p: ChatPlugin) {
    engine.plugins[p.meta.name] = p;
  },

  async run() {
    const settings = await readSettings();
    const args = process.argv.slice(2);
    const openai = new OpenAI({ apiKey: settings.openai_key });

    const logLevel = args.some((x) => x === "--debug") ? "DEBUG" : "INFO";

    const functions = Object.values(engine.plugins).map((x) => x.meta);

    if (args.some((x) => x === "--list-models")) {
      await listModels();
    } else {
      await chat();
    }
    process.exit(0);

    async function listModels() {
      let models = null;
      while (models === null || models.hasNextPage()) {
        models = await openai.models.list();
        for (let m of models.data) {
          console.log(m.id);
        }
      }
    }

    async function chat() {
      console.log("[" + chalk.blueBright(settings.system) + "]");

      const history: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        system(settings.system),
      ];

      // initial use input
      const input = await readLine();
      history.push(user(input));

      while (true) {
        // starting stream
        const stream = await openai.chat.completions.create({
          model: settings.model,
          messages: history,
          functions,
          stream: true,
        });

        let msg = "";
        let fcall = {
          name: "",
          arguments: "",
        };
        for await (const part of stream) {
          // collect regular message
          const p = part.choices[0]?.delta?.content || "";
          if (p) {
            process.stdout.write(chalk.greenBright(p));
            msg += p;
          }

          // collect functino call
          const pfn = part.choices[0]?.delta?.function_call;
          if (pfn) {
            if (pfn.name) {
              fcall.name += pfn.name;
            }
            if (pfn.arguments) {
              fcall.arguments += pfn.arguments;
            }
          }
        }

        stream.controller.abort();

        if (fcall.name) {
          // function call
          history.push(assistantFn(fcall));

          const plugin = engine.plugins[fcall.name];
          if (!plugin) {
            throw new Error("Unregistered function: " + fcall.name);
          }

          const toolkit = {
            log: logger(`[${plugin.meta.name}]`),
            debug:
              logLevel === "DEBUG" ? logger(`[${plugin.meta.name}]`) : () => {},
          };

          const fnResult = await plugin.execute(fcall.arguments, { toolkit });
          console.log();
          history.push(fnResultResp(fcall.name, fnResult));
        } else {
          history.push(assistant(msg));

          // ask user for next input
          console.log("\n");
          const input = await readLine();
          history.push(user(input));
        }
      }
    }
  },
};

async function readSettings() {
  // settings file should be in the HOME directory
  const absPath = path.join(process.env.HOME ?? "", SETTINGS_FILE_NAME);

  if (!fs.existsSync(absPath)) {
    console.log(
      `File ${chalk.bold(
        `~/${SETTINGS_FILE_NAME}`
      )} not found. Do you want to create it? ${chalk.yellowBright("[y]/n")}`
    );
    // TODO: read user input
    process.exit(0);
  }

  const settings = JSON.parse(fs.readFileSync(absPath, "utf-8")) as Settings;
  return settings;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function readLine() {
  const textUntrimmed = await rl.question(chalk.yellow("> "));
  const text = textUntrimmed.trim();

  if (EXIT_COMMANDS.includes(text)) {
    process.exit(0);
  }
  return text;
}

// helpers

function system(
  content: string
): OpenAI.Chat.Completions.ChatCompletionMessageParam {
  return { role: "system", content };
}

function user(
  content: string
): OpenAI.Chat.Completions.ChatCompletionMessageParam {
  return { role: "user", content };
}

function assistant(
  content: string
): OpenAI.Chat.Completions.ChatCompletionMessageParam {
  return { role: "assistant", content };
}

function assistantFn(
  function_call: OpenAI.Chat.Completions.ChatCompletionMessageParam.FunctionCall
): OpenAI.Chat.Completions.ChatCompletionMessageParam {
  return { role: "assistant", content: null, function_call };
}

function fnResultResp(
  name: string,
  content: string
): OpenAI.Chat.Completions.ChatCompletionMessageParam {
  return { role: "function", name, content };
}

export default engine;

function logger(prefix: string) {
  return function log(msg: string) {
    console.log(`${chalk.blueBright(prefix)} ${msg}`);
  };
}
