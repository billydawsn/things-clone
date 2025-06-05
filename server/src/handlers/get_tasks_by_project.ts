
import { db } from '../db';
import { tasksTable, taskTagsTable, tagsTable } from '../db/schema';
import { type GetTasksByProjectInput, type Task, type Tag } from '../schema';
import { eq, inArray } from 'drizzle-orm';

// Extended Task type that includes tags
export type TaskWithTags = Task & {
  tags: Tag[];
};

export const getTasksByProject = async (input: GetTasksByProjectInput): Promise<TaskWithTags[]> => {
  try {
    // Get all tasks for the project
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.project_id, input.project_id))
      .execute();

    if (tasks.length === 0) {
      return [];
    }

    // Get all task IDs
    const taskIds = tasks.map(task => task.id);

    // Get all tags for these tasks in one query
    const taskTagsWithTags = await db.select({
      task_id: taskTagsTable.task_id,
      tag_id: tagsTable.id,
      tag_name: tagsTable.name,
      tag_color: tagsTable.color,
      tag_created_at: tagsTable.created_at
    })
      .from(taskTagsTable)
      .innerJoin(tagsTable, eq(taskTagsTable.tag_id, tagsTable.id))
      .where(inArray(taskTagsTable.task_id, taskIds))
      .execute();

    // Group tags by task_id
    const tagsByTaskId = taskTagsWithTags.reduce((acc, row) => {
      if (!acc[row.task_id]) {
        acc[row.task_id] = [];
      }
      acc[row.task_id].push({
        id: row.tag_id,
        name: row.tag_name,
        color: row.tag_color,
        created_at: row.tag_created_at
      });
      return acc;
    }, {} as Record<number, Tag[]>);

    // Combine tasks with their tags
    const tasksWithTags: TaskWithTags[] = tasks.map(task => ({
      ...task,
      tags: tagsByTaskId[task.id] || []
    }));

    return tasksWithTags;
  } catch (error) {
    console.error('Getting tasks by project failed:', error);
    throw error;
  }
};
