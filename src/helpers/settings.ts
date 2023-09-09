import chalk from "chalk";
import fs from "fs";
import path from "path";
import * as readline from "node:readline/promises";

const SETTINGS_FILE_NAME = ".nicechat.json";

const DEFAULT_MODEL = "gpt-4";
const DEFAULT_SYSTEM =
  "You are a helpful assistant. You answer consise and to the point.";

export type Settings = {
  model: string;
  openai_key: string;
  system: string;
};

const bb = chalk.blueBright;

export async function readSettings() {
  // settings file should be in the HOME directory
  const absPath = path.join(process.env.HOME ?? "", SETTINGS_FILE_NAME);

  if (!fs.existsSync(absPath)) {
    console.log("It seems that you are running for the first time.");
    console.log(
      `Let's create a settings file (${bb(
        "~/" + SETTINGS_FILE_NAME
      )}) for you.\n`
    );

    // api key
    console.log(`Please enter your OpenAI API key:`);
    const openai_key = await readLine();
    // TODO: validate key format

    console.log(`Enter the model to use (${bb(DEFAULT_MODEL)}):`);
    const model = await readLine(DEFAULT_MODEL);

    console.log(`Enter the system message (${bb(DEFAULT_SYSTEM)}):`);
    const system = await readLine(DEFAULT_SYSTEM);

    const settings: Settings = {
      openai_key,
      model,
      system,
    };

    // save settings to disk
    const settingsJson = JSON.stringify(settings, null, 2);
    fs.writeFileSync(absPath, settingsJson);
    console.log("Settings file saved!\n\n");
  }

  const settings = JSON.parse(fs.readFileSync(absPath, "utf-8")) as Settings;
  return settings;
}

async function readLine(defaultValue?: string) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const textUntrimmed = await rl.question(chalk.yellow("> "));

  rl.close();

  const text = textUntrimmed.trim();

  return text || defaultValue || "";
}
