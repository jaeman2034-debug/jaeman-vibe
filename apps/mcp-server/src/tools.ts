import { z } from 'zod';

export const schemas = {
  create_meetup: z.object({
    title: z.string().min(1),
    startAt: z.string().min(1), // ISO8601
    location: z.string().optional(),
    note: z.string().optional(),
  }),
  moderate_listing: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    price: z.number().nonnegative(),
    category: z.string().optional(),
  }),
  send_kpi_report: z.object({
    date: z.string().optional() // 'YYYY-MM-DD'
  }),
};

export type ToolInput<T extends keyof typeof schemas> = z.infer<(typeof schemas)[T]>;
