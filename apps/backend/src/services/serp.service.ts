import type { SerpClient } from "../utils/serp.js";

export class SerpService {
  constructor(private readonly serpClient: SerpClient) {}

  async search(query: string, num: number): Promise<unknown> {
    return this.serpClient.search({ query, num });
  }
}
