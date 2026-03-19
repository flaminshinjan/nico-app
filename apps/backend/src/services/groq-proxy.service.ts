import type {
  GroqClient,
  GroqProxyInput,
  GroqProxyResponse,
} from "../utils/groq.js";

export class GroqProxyService {
  constructor(private readonly groqClient: GroqClient) {}

  async proxyChatCompletions(input: GroqProxyInput): Promise<GroqProxyResponse> {
    return this.groqClient.proxyChatCompletions(input);
  }
}
