import chalk from "chalk";
import * as readline from "node:readline/promises";
import OpenAI from "openai";
import { readSettings } from "./helpers/settings";
import { ChatPlugin } from "./plugins/ChatPlugin";

const EXIT_COMMANDS = ["exit", "quit", "q", "bye"];

const NiceChat = {
  plugins: {} as Record<string, ChatPlugin>,

  registerPlugin(p: ChatPlugin) {
    NiceChat.plugins[p.meta.name] = p;
  },

  async run() {
    const settings = await readSettings();
    const args = process.argv.slice(2);

    const command = args[0] ?? "chat";

    const openai = new OpenAI({ apiKey: settings.openai_key });
    const isDebug = args.some((x) => x === "--debug");

    const functions = Object.values(NiceChat.plugins).map((x) => x.meta);

    if (command === "list-models") {
      await listModels();
    } else if (command === "chat") {
      await chat();
    } else if (command === "help") {
      printHelp();
    } else {
      console.log("Unknown command: " + command);
    }
    process.exit(0);

    function printHelp() {
      console.log("Available commands:");
      const c = chalk.bold;
      console.log(
        `  ${c("chat [--debug]")}   start chat with the assistant (default)`
      );
      console.log(`  ${c("list-models")}      list available models`);
      console.log(`  ${c("help")}             show this help`);
    }

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

          const plugin = NiceChat.plugins[fcall.name];
          if (!plugin) {
            throw new Error("Unregistered function: " + fcall.name);
          }

          const toolkit = {
            log: logger(`[${plugin.meta.name}]`),
            debug: isDebug ? logger(`[${plugin.meta.name}]`) : () => {},
          };

          console.log(
            `[${chalk.blueBright(plugin.meta.name)}]: ${chalk.yellowBright(
              fcall.arguments.replace(/\n/g, " ").replace(/\s+/g, " ")
            )}`
          );
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

async function readLine() {
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

export default NiceChat;

function logger(prefix: string) {
  return function log(msg: string) {
    console.log(`${chalk.blueBright(prefix)} ${msg}`);
  };
}
