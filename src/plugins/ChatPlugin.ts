export interface ChatPlugin {
  meta: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, { type: string; description: string }>;
    };
  };
  execute: (
    args: string,
    options: {
      toolkit: { log: (msg: string) => void; debug: (msg: string) => void };
    }
  ) => Promise<string>;
}
