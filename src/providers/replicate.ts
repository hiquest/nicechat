import chalk from "chalk";
import { readLine } from "../nicechat";

import Replicate from "replicate";

const MAX_TOKENS = 1024;

type Message = {
  role: "user" | "assistant";
  content: string;
};

export async function chat(apiKey: string, model: string, system: string) {
  console.log("apiKey", apiKey);

  const client = new Replicate({
    auth: apiKey,
  });

  console.log("[" + chalk.blueBright(system) + "]");

  const messages: Message[] = [];

  // initial use input
  const input = await readLine();
  messages.push(user(input));

  while (true) {
    let reply = "";

    const i = buildInput(buildPrompt(messages), system);

    for await (const event of client.stream(model as any, { input: i })) {
      const m = event.toString();
      process.stdout.write(chalk.greenBright(m));
      reply += m;
    }

    messages.push(assistant(reply));

    // ask user for next input
    console.log("\n");
    const input = await readLine();
    messages.push(user(input));
  }
}

function user(content: string): Message {
  return {
    role: "user",
    content,
  };
}

function assistant(content: string): Message {
  return {
    role: "assistant",
    content,
  };
}

const buildPrompt = (messages: Message[]) => {
  return messages
    .map((m) => {
      if (m.role === "user") {
        return `[INST] ${m.content} [/INST]`;
      } else {
        return `${m.content}`;
      }
    })
    .join("\n");
};

function buildInput(prompt: string, system: string) {
  return {
    top_k: 10,
    top_p: 0.95,
    prompt,
    max_tokens: MAX_TOKENS,
    temperature: 0.8,
    system_prompt: system,
    repeat_penalty: 1.1,
    presence_penalty: 0,
    frequency_penalty: 0,
  };
}
