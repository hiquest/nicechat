import chalk from "chalk";
import OpenAI, { ClientOptions } from "openai";
import { printStarter } from "../helpers/print";
import { readLine } from "../nicechat";

export async function chatOpenai(
  apiKey: string,
  model: string,
  systemMsg: string,
  baseURL?: "https://openrouter.ai/api/v1",
) {
  const props: ClientOptions = { apiKey };
  if (baseURL) {
    props.baseURL = baseURL;
  }

  const openai = new OpenAI(props);

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
      stream: true,
    });

    let msg = "";
    for await (const part of stream) {
      // collect regular message
      const p = part.choices[0]?.delta?.content || "";
      if (p) {
        process.stdout.write(chalk.white(p));
        msg += p;
      }
    }

    stream.controller.abort();

    messages.push(assistant(msg));

    // ask user for next input
    console.log("\n");
    const input = await readLine();
    messages.push(user(input));
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
