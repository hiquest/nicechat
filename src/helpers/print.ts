import { colors } from "./colors";

export function printStarter(vendor: string, model: string, systemMsg: string) {
  console.log(
    colors.dim(vendor) +
      colors.dim("/") +
      colors.model(model) +
      " " +
      colors.dim("[" + systemMsg + "]"),
  );
}
