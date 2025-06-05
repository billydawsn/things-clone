
import { db } from '../db';
import { tasksTable, taskTagsTable, tagsTable } from '../db/schema';
import { type Task, type Tag } from '../schema';
import { gte, lt, and, isNotNull, eq, inArray } from 'drizzle-orm';

// Extended Task type with tags
export type TaskWithTags = Task & {
  tags: Tag[];
};

export const getTodayTasks = async (): Promise<TaskWithTags[]> => {
  try {
    // Get start and end of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Query tasks scheduled for today (must have a scheduled_date)
    const tasks = await db.select()
      .from(tasksTable)
      .where(
        and(
          isNotNull(tasksTable.scheduled_date),
          gte(tasksTable.scheduled_date, today),
          lt(tasksTable.scheduled_date, tomorrow)
        )
      )
      .execute();

    // If no tasks found, return empty array
    if (tasks.length === 0) {
      return tasks.map(task => ({ ...task, tags: [] }));
    }

    // Get task IDs for tag lookup
    const taskIds = tasks.map(task => task.id);

    // Query all tags for these tasks in one go using inArray
    const taskTagsResults = await db.select({
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
    const tagsByTaskId: Record<number, Tag[]> = {};
    taskTagsResults.forEach(row => {
      if (!tagsByTaskId[row.task_id]) {
        tagsByTaskId[row.task_id] = [];
      }
      tagsByTaskId[row.task_id].push({
        id: row.tag_id,
        name: row.tag_name,
        color: row.tag_color,
        created_at: row.tag_created_at
      });
    });

    // Attach tags to tasks
    return tasks.map(task => ({
      ...task,
      tags: tagsByTaskId[task.id] || []
    }));
  } catch (error) {
    console.error('Failed to get today tasks:', error);
    throw error;
  }
};
