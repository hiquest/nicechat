import chalk from "chalk";
import OpenAI from "openai";
import { logger, readLine } from "../nicechat";
import { ChatPlugin } from "../plugins/ChatPlugin";

export function printStarter(vendor: string, model: string, systemMsg: string) {
  console.log(
    chalk.bold(vendor) +
      "/" +
      chalk.greenBright(model) +
      " " +
      "[" +
      chalk.blueBright(systemMsg) +
      "]",
  );
}

export async function chatOpenai(
  apiKey: string,
  model: string,
  systemMsg: string,
  isDebug: boolean,
  plugins: Map<string, ChatPlugin>,
) {
  const openai = new OpenAI({ apiKey });

  const functions = [...plugins.values()].map((x) => x.meta);

  printStarter("openai", model, systemMsg);

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    system(systemMsg),
  ];

  // initial use input
  const input = await readLine();
  messages.push(user(input));

  while (true) {
    // starting stream
    const stream = await openai.chat.completions.create({
      model,
      messages,
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
      messages.push(assistantFn(fcall));

      const plugin = plugins.get(fcall.name);
      if (!plugin) {
        throw new Error("Unregistered function: " + fcall.name);
      }

      const toolkit = {
        log: logger(`[${plugin.meta.name}]`),
        debug: isDebug ? logger(`[${plugin.meta.name}]`) : () => {},
      };

      console.log(
        `[${chalk.blueBright(plugin.meta.name)}]: ${chalk.yellowBright(
          fcall.arguments.replace(/\n/g, " ").replace(/\s+/g, " "),
        )}`,
      );
      const fnResult = await plugin.execute(fcall.arguments, { toolkit });
      console.log();
      messages.push(fnResultResp(fcall.name, fnResult));
    } else {
      messages.push(assistant(msg));

      // ask user for next input
      console.log("\n");
      const input = await readLine();
      messages.push(user(input));
    }
  }
}

// helpers

function system(
  content: string,
): OpenAI.Chat.Completions.ChatCompletionSystemMessageParam {
  return { role: "system", content };
}

function user(
  content: string,
): OpenAI.Chat.Completions.ChatCompletionUserMessageParam {
  return { role: "user", content };
}

function assistant(
  content: string,
): OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam {
  return { role: "assistant", content };
}

function assistantFn(
  function_call: OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam.FunctionCall,
): OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam {
  return { role: "assistant", content: null, function_call };
}

function fnResultResp(
  name: string,
  content: string,
): OpenAI.Chat.Completions.ChatCompletionMessageParam {
  return { role: "function", name, content };
}
