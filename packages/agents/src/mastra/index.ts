import { Mastra } from "@mastra/core";
import { documentAgent } from "./agents/documentAgent";
import { documentWorkflow } from "./workflows/documentWorkflow";

export const mastra = new Mastra({
  agents: { documentAgent },
  workflows: { documentWorkflow },
});
        
