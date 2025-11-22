import fs from "fs";
import os from "os";
import path from "path";

const SETTINGS_FILE_NAME = ".nicechat.json";

// const DEFAULT_MODEL = "gpt-4";
// const DEFAULT_SYSTEM =
//   "You are a helpful assistant. You answer concisely and to the point.";

export type Profile = {
  vendor: "openai" | "anthropic" | "replicate" | "deepseek" | "openrouter";
  model: string;
  system: string;
};

export type Settings = {
  profiles: Record<string, Profile>;
};

export async function readSettings() {
  // settings file should be in the HOME directory
  const absPath = path.join(os.homedir(), SETTINGS_FILE_NAME);

  try {
    const settings = JSON.parse(fs.readFileSync(absPath, "utf-8")) as Settings;
    return settings;
  } catch (e) {
    console.log("Error reading settings file:", e);
    process.exit(1);
  }
}
