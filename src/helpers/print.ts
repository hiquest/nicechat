import { colors } from "./colors";

export function printStarter(
  vendor: string,
  model: string,
  systemMsg: string,
  reasoning?: string,
) {
  console.log(
    colors.dim(vendor) +
      colors.dim("/") +
      colors.model(model) +
      (reasoning ? colors.dim(" (reasoning: " + reasoning + ")") : "") +
      " " +
      colors.dim("[" + systemMsg + "]"),
  );
}
