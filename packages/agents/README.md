# agents

Mastra agents and workflows for the nico-app (e.g. document generation). [Mastra](https://mastra.ai/) docs: [project structure](https://mastra.ai/docs/getting-started/project-structure).

**Folder structure:**

```
src/mastra/
├── index.ts           # Mastra instance (agents + workflows)
├── agents/            # LLM agents
│   ├── index.ts
│   └── documentAgent.ts
├── tools/             # Reusable tools agents can call
│   ├── index.ts
│   └── serpTool.ts
├── workflows/         # Multi-step workflows
│   ├── index.ts
│   └── documentWorkflow.ts
├── schemas/           # Shared Zod schemas
│   ├── index.ts
│   ├── document.ts
│   └── serp.ts
└── lib/               # Shared helpers
    └── stream.ts
``` We're excited to see what you'll build.

## Getting Started

Start the development server:

```shell
npm run dev
```

Open [http://localhost:4111](http://localhost:4111) in your browser to access [Mastra Studio](https://mastra.ai/docs/getting-started/studio). It provides an interactive UI for building and testing your agents, along with a REST API that exposes your Mastra application as a local service. This lets you start building without worrying about integration right away.

You can start editing files inside the `src/mastra` directory. The development server will automatically reload whenever you make changes.

## Learn more

To learn more about Mastra, visit our [documentation](https://mastra.ai/docs/). Your bootstrapped project includes example code for [agents](https://mastra.ai/docs/agents/overview), [tools](https://mastra.ai/docs/agents/using-tools), [workflows](https://mastra.ai/docs/workflows/overview), [scorers](https://mastra.ai/docs/evals/overview), and [observability](https://mastra.ai/docs/observability/overview).

If you're new to AI agents, check out our [course](https://mastra.ai/course) and [YouTube videos](https://youtube.com/@mastra-ai). You can also join our [Discord](https://discord.gg/BTYqqHKUrf) community to get help and share your projects.

## Deploy on Mastra Cloud

[Mastra Cloud](https://cloud.mastra.ai/) gives you a serverless agent environment with atomic deployments. Access your agents from anywhere and monitor performance. Make sure they don't go off the rails with evals and tracing.

Check out the [deployment guide](https://mastra.ai/docs/deployment/overview) for more details.
