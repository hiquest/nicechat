import OpenAI, { ClientOptions } from "openai";
import { colors } from "../helpers/colors";
import { printStarter } from "../helpers/print";
import { ReasoningEffort } from "../helpers/settings";
import { readLine } from "../nicechat";

export async function chatOpenai(
  apiKey: string,
  model: string,
  systemMsg: string,
  baseURL?: "https://openrouter.ai/api/v1",
  reasoning?: ReasoningEffort,
) {
  const props: ClientOptions = { apiKey };
  if (baseURL) {
    props.baseURL = baseURL;
  }

  const openai = new OpenAI(props);

  printStarter(baseURL ? "openrouter" : "openai", model, systemMsg, reasoning);

  // openrouter takes `reasoning: { effort }`, openai takes `reasoning_effort`
  const reasoningParams = !reasoning
    ? {}
    : baseURL
      ? { reasoning: { effort: reasoning } }
      : { reasoning_effort: reasoning };

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
      ...reasoningParams,
    });

    let msg = "";
    let reasoned = false;
    for await (const part of stream) {
      const delta = part.choices[0]?.delta as
        | (typeof part.choices)[0]["delta"] & { reasoning?: string }
        | undefined;

      // reasoning summary, when the model streams one
      const r = delta?.reasoning || "";
      if (r) {
        process.stdout.write(colors.dim(r));
        reasoned = true;
      }

      // collect regular message
      const p = delta?.content || "";
      if (p) {
        if (reasoned && !msg) {
          process.stdout.write("\n\n");
        }
        process.stdout.write(colors.reply(p));
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
