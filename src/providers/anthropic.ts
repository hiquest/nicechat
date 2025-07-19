import Anthropic from "@anthropic-ai/sdk";
import chalk from "chalk";
import { readLine } from "../nicechat";
import { MessageParam } from "@anthropic-ai/sdk/resources/messages.mjs";
import { printStarter } from "./openai";

const MAX_TOKENS = 1024;

export async function chat(apiKey: string, model: string, system: string) {
  const client = new Anthropic({
    apiKey,
  });

  printStarter("anthropic", model, system);

  const messages: MessageParam[] = [];

  // initial use input
  const input = await readLine();
  messages.push(user(input));

  while (true) {
    const response = await exchange(client, model, system, messages);
    messages.push(assistant(response));

    // ask user for next input
    console.log("\n");
    const input = await readLine();
    messages.push(user(input));
  }
}

function user(content: string): MessageParam {
  return {
    role: "user",
    content,
  };
}

function assistant(content: string): MessageParam {
  return {
    role: "assistant",
    content,
  };
}

async function exchange(
  client: Anthropic,
  model: string,
  system: string,
  messages: MessageParam[],
): Promise<string> {
  return new Promise((resolve) => {
    let msg = "";

    client.messages
      .stream({
        messages,
        model,
        max_tokens: MAX_TOKENS,
        system,
      })
      .on("text", (p) => {
        // collect regular message
        if (p) {
          process.stdout.write(chalk.greenBright(p));
          msg += p;
        }
      })
      .on("end", () => {
        resolve(msg);
      });
  });
}
