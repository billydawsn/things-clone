
import { db } from '../db';
import { tasksTable, taskTagsTable, tagsTable } from '../db/schema';
import { type GetTasksByAreaInput } from '../schema';
import { eq, inArray } from 'drizzle-orm';

// Extended Task type that includes tags
export type TaskWithTags = {
  id: number;
  title: string;
  notes: string | null;
  project_id: number | null;
  area_id: number | null;
  due_date: Date | null;
  deadline_date: Date | null;
  scheduled_date: Date | null;
  is_completed: boolean;
  completed_at: Date | null;
  priority: 'low' | 'medium' | 'high' | null;
  created_at: Date;
  updated_at: Date;
  tags: Array<{
    id: number;
    name: string;
    color: string | null;
    created_at: Date;
  }>;
};

export const getTasksByArea = async (input: GetTasksByAreaInput): Promise<TaskWithTags[]> => {
  try {
    // Get tasks in the specified area
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.area_id, input.area_id))
      .execute();

    // If no tasks, return empty array
    if (tasks.length === 0) {
      return [];
    }

    // Get all task IDs to fetch their tags
    const taskIds = tasks.map(task => task.id);

    // Get all tags for these tasks
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

    // Group tags by task_id for efficient lookup
    const tagsByTaskId = new Map<number, Array<{
      id: number;
      name: string;
      color: string | null;
      created_at: Date;
    }>>();

    taskTagsWithTags.forEach(item => {
      if (!tagsByTaskId.has(item.task_id)) {
        tagsByTaskId.set(item.task_id, []);
      }
      tagsByTaskId.get(item.task_id)!.push({
        id: item.tag_id,
        name: item.tag_name,
        color: item.tag_color,
        created_at: item.tag_created_at
      });
    });

    // Map tasks with their associated tags
    return tasks.map(task => ({
      ...task,
      due_date: task.due_date || null,
      deadline_date: task.deadline_date || null,
      scheduled_date: task.scheduled_date || null,
      completed_at: task.completed_at || null,
      priority: task.priority || null,
      tags: tagsByTaskId.get(task.id) || []
    }));
  } catch (error) {
    console.error('Get tasks by area failed:', error);
    throw error;
  }
};
