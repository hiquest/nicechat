import chalk from "chalk";

export function printStarter(vendor: string, model: string, systemMsg: string) {
  console.log(
    chalk.dim(vendor) +
      chalk.dim("/") +
      chalk.magentaBright(model) +
      " " +
      chalk.dim("[" + systemMsg + "]"),
  );
}
