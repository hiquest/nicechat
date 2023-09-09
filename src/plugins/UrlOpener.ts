import { execSync } from "child_process";
import { ChatPlugin } from "./ChatPlugin";

const UrlOpener: ChatPlugin = {
  meta: {
    name: "url_opener",
    description: "Opens a url in user's default browser",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The url of the website to open in browser",
        },
      },
    },
  },
  execute: async (args: string, { toolkit }) => {
    const url = JSON.parse(args)["url"];
    toolkit.debug(`Opening: ${url}`);

    // check if user is on mac

    if (process.platform == "darwin") {
      execSync(`open ${url}`);
    } else if (process.platform == "win32") {
      execSync(`start ${url}`);
    } else if (process.platform == "linux") {
      execSync(`xdg-open ${url}`);
    } else {
      toolkit.debug(`Platform ${process.platform} not supported`);
      return `Platform ${process.platform} not supported`;
    }

    return "Opened.";
  },
};

export default UrlOpener;
