
import { db } from '../db';
import { tasksTable, taskTagsTable, projectsTable, areasTable, tagsTable } from '../db/schema';
import { type CreateTaskInput, type Task, type Tag } from '../schema';
import { eq, inArray } from 'drizzle-orm';

// Extended Task type with tags for this handler's return
type TaskWithTags = Task & { tags: Tag[] };

export const createTask = async (input: CreateTaskInput): Promise<TaskWithTags> => {
  try {
    // Validate foreign key references exist
    if (input.project_id) {
      const project = await db.select()
        .from(projectsTable)
        .where(eq(projectsTable.id, input.project_id))
        .execute();
      
      if (project.length === 0) {
        throw new Error(`Project with id ${input.project_id} does not exist`);
      }
    }

    if (input.area_id) {
      const area = await db.select()
        .from(areasTable)
        .where(eq(areasTable.id, input.area_id))
        .execute();
      
      if (area.length === 0) {
        throw new Error(`Area with id ${input.area_id} does not exist`);
      }
    }

    if (input.tag_ids && input.tag_ids.length > 0) {
      const tags = await db.select()
        .from(tagsTable)
        .where(inArray(tagsTable.id, input.tag_ids))
        .execute();
      
      if (tags.length !== input.tag_ids.length) {
        const foundIds = tags.map(tag => tag.id);
        const missingIds = input.tag_ids.filter(id => !foundIds.includes(id));
        throw new Error(`Tags with ids ${missingIds.join(', ')} do not exist`);
      }
    }

    // Insert task record
    const result = await db.insert(tasksTable)
      .values({
        title: input.title,
        notes: input.notes || null,
        project_id: input.project_id || null,
        area_id: input.area_id || null,
        due_date: input.due_date || null,
        deadline_date: input.deadline_date || null,
        scheduled_date: input.scheduled_date || null,
        priority: input.priority || null
      })
      .returning()
      .execute();

    const task = result[0];

    // Insert task-tag relationships if tag_ids provided
    if (input.tag_ids && input.tag_ids.length > 0) {
      const taskTagValues = input.tag_ids.map(tag_id => ({
        task_id: task.id,
        tag_id: tag_id
      }));

      await db.insert(taskTagsTable)
        .values(taskTagValues)
        .execute();
    }

    // Fetch associated tags for the created task
    const taskTags = await db.select({
      id: tagsTable.id,
      name: tagsTable.name,
      color: tagsTable.color,
      created_at: tagsTable.created_at
    })
      .from(taskTagsTable)
      .innerJoin(tagsTable, eq(taskTagsTable.tag_id, tagsTable.id))
      .where(eq(taskTagsTable.task_id, task.id))
      .execute();

    return {
      ...task,
      tags: taskTags
    } as TaskWithTags;
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};
