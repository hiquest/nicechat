import { ChatPlugin } from "./ChatPlugin";
import TurndownService from "turndown";

const FetchWebsite: ChatPlugin = {
  meta: {
    name: "fetch_website",
    description: "Fetch website's main content from the internet as markdown",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The url of the website to fetch",
        },
      },
    },
  },
  execute: async (args: string, { toolkit }) => {
    const url = JSON.parse(args)["url"];
    toolkit.debug(`Fetching: ${url}`);
    const html = await fetch(url).then((x) => x.text());
    // toolkit.debug(`Raw html: ${html}`);

    const res = htmlToMd(html, toolkit.debug);
    toolkit.debug(`Result: ${res}`);
    return res;
  },
};

export default FetchWebsite;

function htmlToMd(html: string, d: (s: string) => void) {
  const hasMainTag = html.includes("<main");
  d("hasMainTag: " + hasMainTag);

  const hasArticleTag = html.includes("<article");
  d("hasArticleTag: " + hasArticleTag);

  const hasMultipleArticleTags = html.split("<article").length > 2;

  // stretegy 1: if there is only one article tag, then we can just use that
  if (hasArticleTag && !hasMultipleArticleTags) {
    const article =
      "<article" +
      html.split("<article")[1].split("</article>")[0] +
      "</article>";
    const res = processHtml(removeStyleAndScript(article));
    // console.log("res", res);
    return res;
  }

  // stretegy 2: if there is a main tag, then we can just use that
  if (hasMainTag) {
    const mainContent =
      "<main" + html.split("<main")[1].split("</main>")[0] + "</main>";

    const res = processHtml(removeStyleAndScript(mainContent));
    // console.log("res", res);
    return res;
  }

  // stretegy 3: if there is a body tag, then we can just use that
  const bodyContent =
    "<body" + html.split("<body")[1].split("</body>")[0] + "</body>";

  d("bodyContent: " + bodyContent);

  const res = processHtml(removeStyleAndScript(bodyContent));
  // console.log("res", res);
  return res;
}

function removeStyleAndScript(html: string) {
  // Remove style tags and their contents
  let cleanedHtml = html.replace(/<style[\s\S]*?<\/style>/gi, "");

  // Remove script tags and their contents
  cleanedHtml = cleanedHtml.replace(/<script[\s\S]*?<\/script>/gi, "");

  return cleanedHtml;
}

function processHtml(html: string) {
  const parts = html.split(/(<[^>]+>)/).filter((s) => !!s);

  const res = parts.map((s) => {
    if (s.startsWith("<") && !s.startsWith("</")) {
      const n = s
        .split(" ")
        .filter(
          (x) => x.startsWith("<") || x.startsWith(">") || x.startsWith("href")
        )
        .join(" ");

      if (!n.endsWith(">")) {
        return n + ">";
      }
      return n;
    }

    return s;
  });

  const turndownService = new TurndownService({ headingStyle: "atx" });
  return turndownService.turndown(res.join(""));
}
