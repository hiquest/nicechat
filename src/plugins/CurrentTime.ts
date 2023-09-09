import { ChatPlugin } from "./ChatPlugin";

const CurrentTime: ChatPlugin = {
  meta: {
    name: "current_time",
    description: "Returns the current date and time",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  execute: async (_args: string) => {
    const date = new Date();
    const time = date.toLocaleTimeString();
    const day = date.toLocaleDateString();

    return `It is currently ${time} on ${day}`;
  },
};

export default CurrentTime;
