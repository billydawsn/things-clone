
import { serial, text, pgTable, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Priority enum
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);

// Areas table
export const areasTable = pgTable('areas', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Projects table
export const projectsTable = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  area_id: integer('area_id').references(() => areasTable.id, { onDelete: 'set null' }),
  color: text('color'),
  is_completed: boolean('is_completed').default(false).notNull(),
  completed_at: timestamp('completed_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Tags table
export const tagsTable = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Tasks table
export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  notes: text('notes'),
  project_id: integer('project_id').references(() => projectsTable.id, { onDelete: 'set null' }),
  area_id: integer('area_id').references(() => areasTable.id, { onDelete: 'set null' }),
  due_date: timestamp('due_date'),
  deadline_date: timestamp('deadline_date'),
  scheduled_date: timestamp('scheduled_date'),
  is_completed: boolean('is_completed').default(false).notNull(),
  completed_at: timestamp('completed_at'),
  priority: priorityEnum('priority'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Task-Tag junction table
export const taskTagsTable = pgTable('task_tags', {
  task_id: integer('task_id').references(() => tasksTable.id, { onDelete: 'cascade' }).notNull(),
  tag_id: integer('tag_id').references(() => tagsTable.id, { onDelete: 'cascade' }).notNull()
});

// Relations
export const areasRelations = relations(areasTable, ({ many }) => ({
  projects: many(projectsTable),
  tasks: many(tasksTable)
}));

export const projectsRelations = relations(projectsTable, ({ one, many }) => ({
  area: one(areasTable, {
    fields: [projectsTable.area_id],
    references: [areasTable.id]
  }),
  tasks: many(tasksTable)
}));

export const tasksRelations = relations(tasksTable, ({ one, many }) => ({
  project: one(projectsTable, {
    fields: [tasksTable.project_id],
    references: [projectsTable.id]
  }),
  area: one(areasTable, {
    fields: [tasksTable.area_id],
    references: [areasTable.id]
  }),
  taskTags: many(taskTagsTable)
}));

export const tagsRelations = relations(tagsTable, ({ many }) => ({
  taskTags: many(taskTagsTable)
}));

export const taskTagsRelations = relations(taskTagsTable, ({ one }) => ({
  task: one(tasksTable, {
    fields: [taskTagsTable.task_id],
    references: [tasksTable.id]
  }),
  tag: one(tagsTable, {
    fields: [taskTagsTable.tag_id],
    references: [tagsTable.id]
  })
}));

// Export all tables
export const tables = {
  areas: areasTable,
  projects: projectsTable,
  tags: tagsTable,
  tasks: tasksTable,
  taskTags: taskTagsTable
};
