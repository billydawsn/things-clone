
import { z } from 'zod';

// Area schema
export const areaSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Area = z.infer<typeof areaSchema>;

// Project schema
export const projectSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  area_id: z.number().nullable(),
  color: z.string().nullable(),
  is_completed: z.boolean(),
  completed_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Project = z.infer<typeof projectSchema>;

// Tag schema
export const tagSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Tag = z.infer<typeof tagSchema>;

// Task (Thing) schema
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  notes: z.string().nullable(),
  project_id: z.number().nullable(),
  area_id: z.number().nullable(),
  due_date: z.coerce.date().nullable(),
  deadline_date: z.coerce.date().nullable(),
  scheduled_date: z.coerce.date().nullable(),
  is_completed: z.boolean(),
  completed_at: z.coerce.date().nullable(),
  priority: z.enum(['low', 'medium', 'high']).nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Task-Tag relationship schema
export const taskTagSchema = z.object({
  task_id: z.number(),
  tag_id: z.number()
});

export type TaskTag = z.infer<typeof taskTagSchema>;

// Input schemas for creating
export const createAreaInputSchema = z.object({
  name: z.string().min(1),
  color: z.string().nullable().optional()
});

export type CreateAreaInput = z.infer<typeof createAreaInputSchema>;

export const createProjectInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  area_id: z.number().nullable().optional(),
  color: z.string().nullable().optional()
});

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

export const createTagInputSchema = z.object({
  name: z.string().min(1),
  color: z.string().nullable().optional()
});

export type CreateTagInput = z.infer<typeof createTagInputSchema>;

export const createTaskInputSchema = z.object({
  title: z.string().min(1),
  notes: z.string().nullable().optional(),
  project_id: z.number().nullable().optional(),
  area_id: z.number().nullable().optional(),
  due_date: z.coerce.date().nullable().optional(),
  deadline_date: z.coerce.date().nullable().optional(),
  scheduled_date: z.coerce.date().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).nullable().optional(),
  tag_ids: z.array(z.number()).optional()
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schemas for updating
export const updateAreaInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  color: z.string().nullable().optional()
});

export type UpdateAreaInput = z.infer<typeof updateAreaInputSchema>;

export const updateProjectInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  area_id: z.number().nullable().optional(),
  color: z.string().nullable().optional(),
  is_completed: z.boolean().optional()
});

export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;

export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  notes: z.string().nullable().optional(),
  project_id: z.number().nullable().optional(),
  area_id: z.number().nullable().optional(),
  due_date: z.coerce.date().nullable().optional(),
  deadline_date: z.coerce.date().nullable().optional(),
  scheduled_date: z.coerce.date().nullable().optional(),
  is_completed: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).nullable().optional(),
  tag_ids: z.array(z.number()).optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Query input schemas
export const getTasksByAreaInputSchema = z.object({
  area_id: z.number()
});

export type GetTasksByAreaInput = z.infer<typeof getTasksByAreaInputSchema>;

export const getTasksByProjectInputSchema = z.object({
  project_id: z.number()
});

export type GetTasksByProjectInput = z.infer<typeof getTasksByProjectInputSchema>;

export const deleteInputSchema = z.object({
  id: z.number()
});

export type DeleteInput = z.infer<typeof deleteInputSchema>;
