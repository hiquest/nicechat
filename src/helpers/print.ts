import chalk from "chalk";

export function printStarter(vendor: string, model: string, systemMsg: string) {
  console.log(
    chalk.bold(vendor) +
      "/" +
      chalk.greenBright(model) +
      " " +
      "[" +
      chalk.blueBright(systemMsg) +
      "]",
  );
}
