import { z } from 'zod'
import type { LayoutDocument } from './types'

const inlineMarkSchema = z.enum(['bold', 'italic', 'underline', 'strikethrough', 'code'])

const textRunSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  source: z.string(),
  marks: z.array(inlineMarkSchema).optional(),
}).strict()

const inlineMathSchema = z.object({
  type: z.literal('math'),
  latex: z.string(),
  source: z.string(),
}).strict()

const lineBreakSchema = z.object({
  type: z.literal('break'),
  source: z.literal('\n'),
}).strict()

const inlineContentSchema = z.discriminatedUnion('type', [textRunSchema, inlineMathSchema, lineBreakSchema])
const inlineArraySchema = z.array(inlineContentSchema)

const sourceBlockSchema = {
  id: z.string().min(1),
  source: z.string(),
}

const headingSchema = z.object({
  ...sourceBlockSchema,
  type: z.literal('heading'),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  content: inlineArraySchema,
}).strict()

const paragraphSchema = z.object({
  ...sourceBlockSchema,
  type: z.literal('paragraph'),
  content: inlineArraySchema,
}).strict()

const quoteSchema = z.object({
  ...sourceBlockSchema,
  type: z.literal('quote'),
  content: inlineArraySchema,
  attribution: inlineArraySchema.optional(),
}).strict()

const listItemSchema: z.ZodType<{
  content: z.infer<typeof inlineArraySchema>
  children?: { ordered: boolean; items: unknown[] }
}> = z.lazy(() => z.object({
  marker: z.string().optional(),
  content: inlineArraySchema,
  children: z.object({
    ordered: z.boolean(),
    items: z.array(listItemSchema),
  }).strict().optional(),
}).strict())

const listSchema = z.object({
  ...sourceBlockSchema,
  type: z.literal('list'),
  ordered: z.boolean(),
  items: z.array(listItemSchema),
}).strict()

const codeSchema = z.object({
  ...sourceBlockSchema,
  type: z.literal('code'),
  code: z.string(),
  language: z.string().optional(),
}).strict()

const mathSchema = z.object({
  ...sourceBlockSchema,
  type: z.literal('math'),
  latex: z.string(),
}).strict()

const tableSchema = z.object({
  ...sourceBlockSchema,
  type: z.literal('table'),
  headers: z.array(inlineArraySchema),
  rows: z.array(z.array(inlineArraySchema)),
}).strict()

const calloutSchema = z.object({
  ...sourceBlockSchema,
  type: z.literal('callout'),
  tone: z.enum(['note', 'important']),
  content: inlineArraySchema,
}).strict()

const dividerSchema = z.object({
  ...sourceBlockSchema,
  type: z.literal('divider'),
}).strict()

const documentBlockSchema = z.discriminatedUnion('type', [
  headingSchema,
  paragraphSchema,
  quoteSchema,
  listSchema,
  codeSchema,
  mathSchema,
  tableSchema,
  calloutSchema,
  dividerSchema,
])

export const layoutDocumentSchema = z.object({
  version: z.literal(1),
  sourceText: z.string(),
  meta: z.object({
    category: z.string().optional(),
    description: z.string().optional(),
  }).strict(),
  blocks: z.array(documentBlockSchema).min(1),
}).strict()

export function parseLayoutDocument(input: unknown): LayoutDocument {
  return layoutDocumentSchema.parse(input) as LayoutDocument
}
