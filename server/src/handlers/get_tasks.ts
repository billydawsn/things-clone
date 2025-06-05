
import { db } from '../db';
import { tasksTable, taskTagsTable, tagsTable } from '../db/schema';
import { type Task, type Tag } from '../schema';
import { desc, eq, or } from 'drizzle-orm';

// Extended Task type that includes tags
export type TaskWithTags = Task & {
  tags: Tag[];
};

export const getTasks = async (): Promise<TaskWithTags[]> => {
  try {
    // First, get all tasks
    const tasks = await db.select()
      .from(tasksTable)
      .orderBy(desc(tasksTable.created_at))
      .execute();

    // If no tasks, return empty array
    if (tasks.length === 0) {
      return [];
    }

    // Get all task IDs for batch tag fetching
    const taskIds = tasks.map(task => task.id);

    // Build OR conditions for each task ID
    const taskIdConditions = taskIds.map(id => eq(taskTagsTable.task_id, id));
    
    // Fetch all task-tag relationships and associated tags in one query
    const taskTagsWithTags = await db.select({
      task_id: taskTagsTable.task_id,
      tag_id: tagsTable.id,
      tag_name: tagsTable.name,
      tag_color: tagsTable.color,
      tag_created_at: tagsTable.created_at
    })
      .from(taskTagsTable)
      .innerJoin(tagsTable, eq(taskTagsTable.tag_id, tagsTable.id))
      .where(or(...taskIdConditions))
      .execute();

    // Create a map of task_id to tags for efficient lookup
    const taskTagsMap = new Map<number, Tag[]>();
    
    taskTagsWithTags.forEach(item => {
      const taskId = item.task_id;
      const tag: Tag = {
        id: item.tag_id,
        name: item.tag_name,
        color: item.tag_color,
        created_at: item.tag_created_at
      };

      if (!taskTagsMap.has(taskId)) {
        taskTagsMap.set(taskId, []);
      }
      taskTagsMap.get(taskId)!.push(tag);
    });

    // Combine tasks with their tags
    return tasks.map(task => ({
      ...task,
      tags: taskTagsMap.get(task.id) || []
    }));
  } catch (error) {
    console.error('Failed to get tasks:', error);
    throw error;
  }
};
