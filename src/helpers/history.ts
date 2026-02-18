import os from "os";
import path from "path";
import fs from "fs";

const HISTORY_FILE = path.join(os.homedir(), ".nicechat_history");

export function loadHistory(): string[] {
  try {
    return fs.readFileSync(HISTORY_FILE, "utf-8").split("\n").filter(Boolean).reverse();
  } catch {
    return [];
  }
}

export function appendHistory(line: string) {
  fs.appendFileSync(HISTORY_FILE, line + "\n");
}

export function writeHistory(lines: string[]) {
  fs.writeFileSync(HISTORY_FILE, lines.join("\n") + "\n");
}
