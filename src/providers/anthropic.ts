import Anthropic from "@anthropic-ai/sdk";
import {
  MessageParam,
  OutputConfig,
  ThinkingConfigParam,
} from "@anthropic-ai/sdk/resources/messages.mjs";
import { colors } from "../helpers/colors";
import { printStarter } from "../helpers/print";
import { ReasoningEffort } from "../helpers/settings";
import { readLine } from "../nicechat";

const MAX_TOKENS = 8096;
// thinking tokens count against max_tokens, so give them room
const MAX_TOKENS_THINKING = 32000;

export async function chat(
  apiKey: string,
  model: string,
  system: string,
  reasoning?: ReasoningEffort,
) {
  const client = new Anthropic({
    apiKey,
  });

  printStarter("anthropic", model, system, reasoning);

  const messages: MessageParam[] = [];

  // initial use input
  const input = await readLine();
  messages.push(user(input));

  while (true) {
    const response = await exchange(
      client,
      model,
      system,
      messages,
      reasoning,
    );
    messages.push(assistant(response));

    // ask user for next input
    console.log("\n");
    const input = await readLine();
    messages.push(user(input));
  }
}

// only sent when the profile asks for reasoning: adaptive thinking is rejected
// by models older than 4.6, so the plain request shape stays the default
function thinkingParams(reasoning?: ReasoningEffort) {
  if (!reasoning) {
    return {};
  }

  if (reasoning === "none") {
    return { thinking: { type: "disabled" } } as const;
  }

  return {
    // `display` is newer than the installed SDK types; without it the thinking
    // blocks stream empty
    thinking: {
      type: "adaptive",
      display: "summarized",
    } as ThinkingConfigParam,
    output_config: { effort: effort(reasoning) },
  };
}

function effort(reasoning: ReasoningEffort) {
  const level = reasoning === "minimal" ? "low" : reasoning;
  // `xhigh` is newer than the installed SDK types
  return level as NonNullable<OutputConfig["effort"]>;
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
  reasoning?: ReasoningEffort,
): Promise<string> {
  return new Promise((resolve, reject) => {
    let msg = "";
    let reasoned = false;

    client.messages
      .stream({
        messages,
        model,
        max_tokens: reasoning ? MAX_TOKENS_THINKING : MAX_TOKENS,
        system,
        ...thinkingParams(reasoning),
      })
      // summarized reasoning, when the model streams one
      .on("thinking", (p) => {
        if (p) {
          process.stdout.write(colors.dim(p));
          reasoned = true;
        }
      })
      .on("text", (p) => {
        // collect regular message
        if (p) {
          if (reasoned && !msg) {
            process.stdout.write("\n\n");
          }
          process.stdout.write(colors.reply(p));
          msg += p;
        }
      })
      .on("end", () => {
        resolve(msg);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}
