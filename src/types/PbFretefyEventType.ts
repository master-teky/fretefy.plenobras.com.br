import { z } from "zod/v4"

export const eventAttachmentRowSchema = z.object({
  eventId: z.number(),
  eventType: z.number(),
  description: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  attachmentId: z.number().nullable(),
  url: z.string().nullable(),
  contentType: z.string().nullable(),
  fileName: z.string().nullable(),
  size: z.number().nullable(),
})

export type EventAttachmentRow = z.infer<typeof eventAttachmentRowSchema>