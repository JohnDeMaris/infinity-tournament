import { z } from 'zod';

export const createTournamentSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  date_start: z.string().min(1, 'Start date is required'),
  date_end: z.string().optional(),
  location: z.string().min(3, 'Location must be at least 3 characters'),
  point_limit: z.coerce.number().min(50).max(500),
  rounds: z.coerce.number().min(1).max(10),
  time_limit: z.coerce.number().min(30).max(240),
  max_capacity: z.coerce.number().min(4).max(128).nullable().optional(),
  registration_deadline: z.string().optional().nullable(),
  list_deadline: z.string().optional().nullable(),
});

export const updateTournamentSchema = createTournamentSchema.partial().extend({
  status: z.enum(['draft', 'registration', 'active', 'completed']).optional(),
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;
