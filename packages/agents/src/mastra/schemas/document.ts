import { z } from "zod";

export interface HeadingBlock {
  id: string
  type: "heading"
  level: 1 | 2 | 3
  content: string
}

export interface ParagraphBlock {
  id: string
  type: "paragraph"
  content: string
}

export interface ListBlock {
  id: string
  type: "list"
  style: "ordered" | "unordered"
  items: string[]
}

export interface SalutationBlock {
  id: string
  type: "salutation"
  content: string
}

export interface ClosingBlock {
  id: string
  type: "closing"
  content: string
}

export interface ClauseBlock {
  id: string
  type: "clause"
  title: string
  content: string
}

export interface SpacerBlock {
  id: string
  type: "spacer"
}

export type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | SalutationBlock
  | ClosingBlock
  | ClauseBlock
  | SpacerBlock

const headingBlockSchema = z.object({
  id: z.string(),
  type: z.literal("heading"),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  content: z.string(),
})

const paragraphBlockSchema = z.object({
  id: z.string(),
  type: z.literal("paragraph"),
  content: z.string(),
})

const listBlockSchema = z.object({
  id: z.string(),
  type: z.literal("list"),
  style: z.union([z.literal("ordered"), z.literal("unordered")]),
  items: z.array(z.string()),
})

const salutationBlockSchema = z.object({
  id: z.string(),
  type: z.literal("salutation"),
  content: z.string(),
})

const closingBlockSchema = z.object({
  id: z.string(),
  type: z.literal("closing"),
  content: z.string(),
})

const clauseBlockSchema = z.object({
  id: z.string(),
  type: z.literal("clause"),
  title: z.string(),
  content: z.string(),
})

const spacerBlockSchema = z.object({
  id: z.string(),
  type: z.literal("spacer"),
})

export const documentResultSchema = z.object({
  title: z.string(),
  content: z.array(z.discriminatedUnion("type", [
    headingBlockSchema,
    paragraphBlockSchema,
    listBlockSchema,
    salutationBlockSchema,
    closingBlockSchema,
    clauseBlockSchema,
    spacerBlockSchema,
  ])),
})

export type DocumentResult = z.infer<typeof documentResultSchema>

export const legacyDocumentResultSchema = z.object({
  title: z.string(),
  markdown: z.string(),
})

export type LegacyDocumentResult = z.infer<typeof legacyDocumentResultSchema>

export function isLegacyFormat(data: unknown): data is LegacyDocumentResult {
  return (
    typeof data === "object" &&
    data !== null &&
    "markdown" in data &&
    !("content" in data)
  )
}
