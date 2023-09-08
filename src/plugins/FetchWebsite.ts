import {ChatPlugin} from "./ChatPlugin";
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
    toolkit.log(`Fetching: ${url}`);
    const html = await fetch(url).then((x) => x.text());
    return htmlToMd(html);
  },
};

export default FetchWebsite;

function htmlToMd(html: string) {
  const hasMainTag = html.includes("<main");
  // console.log("hasMainTag", hasMainTag);

  const hasArticleTag = html.includes("<article");
  // console.log("hasArticleTag", hasMainTag);

  const hasMultipleArticleTags = html.split("<article").length > 2;

  // stretegy 1: if there is only one article tag, then we can just use that
  if (hasArticleTag && !hasMultipleArticleTags) {
    const article = "<article" + html.split("<article")[1].split("</article>")[0] + "</article>";
    const res = processHtml(article);
    // console.log("res", res);
    return res;
  }

  // stretegy 2: if there is a main tag, then we can just use that
  if (hasMainTag) {
    const mainContent =
      "<main" + html.split("<main")[1].split("</main>")[0] + "</main>";

    const res = processHtml(mainContent);
    // console.log("res", res);
    return res;
  }

  // stretegy 3: if there is a body tag, then we can just use that
  const bodyContent = '<body' +  html.split("<body")[1].split("</body>")[0] + "</body>";
  const res = processHtml(bodyContent);
  // console.log("res", res);
  return res;
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
