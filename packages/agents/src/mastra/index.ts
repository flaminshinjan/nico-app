import { Mastra } from "@mastra/core";
import { documentAgent } from "./agents";
import { documentWorkflow } from "./workflows";

export const mastra = new Mastra({
  agents: { documentAgent },
  workflows: { documentWorkflow },
});

