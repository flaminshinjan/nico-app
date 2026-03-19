import { Mastra } from "@mastra/core";
<<<<<<< HEAD
import { documentAgent } from "./agents";
import { documentWorkflow } from "./workflows";
=======
import { documentAgent } from "./agents/documentAgent";
import { documentWorkflow } from "./workflows/documentWorkflow";
>>>>>>> 930dd86f6a3ec25c0fc95f5a07f1be4ff8306843

export const mastra = new Mastra({
  agents: { documentAgent },
  workflows: { documentWorkflow },
});
<<<<<<< HEAD

=======
        
>>>>>>> 930dd86f6a3ec25c0fc95f5a07f1be4ff8306843
