
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, tagsTable, taskTagsTable } from '../db/schema';
import { getTodayTasks, type TaskWithTags } from '../handlers/get_today_tasks';

describe('getTodayTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return tasks scheduled for today', async () => {
    // Create a task scheduled for today
    const today = new Date();
    today.setHours(10, 0, 0, 0); // Set to 10 AM today

    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Today Task',
        scheduled_date: today,
        is_completed: false
      })
      .returning()
      .execute();

    const result = await getTodayTasks();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Today Task');
    expect(result[0].scheduled_date).toBeInstanceOf(Date);
    expect(result[0].tags).toEqual([]);
  });

  it('should return tasks with associated tags', async () => {
    // Create tags
    const tagResults = await db.insert(tagsTable)
      .values([
        { name: 'urgent', color: '#ff0000' },
        { name: 'work', color: '#0000ff' }
      ])
      .returning()
      .execute();

    // Create task scheduled for today
    const today = new Date();
    today.setHours(14, 30, 0, 0); // Set to 2:30 PM today

    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Tagged Task',
        scheduled_date: today,
        is_completed: false
      })
      .returning()
      .execute();

    // Associate tags with task
    await db.insert(taskTagsTable)
      .values([
        { task_id: taskResult[0].id, tag_id: tagResults[0].id },
        { task_id: taskResult[0].id, tag_id: tagResults[1].id }
      ])
      .execute();

    const result = await getTodayTasks();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Tagged Task');
    expect(result[0].tags).toHaveLength(2);
    
    // Check tag details
    const tagNames = result[0].tags.map((tag: any) => tag.name).sort();
    expect(tagNames).toEqual(['urgent', 'work']);
    
    const urgentTag = result[0].tags.find((tag: any) => tag.name === 'urgent');
    expect(urgentTag).toBeDefined();
    expect(urgentTag!.color).toEqual('#ff0000');
    expect(urgentTag!.id).toEqual(tagResults[0].id);
    expect(urgentTag!.created_at).toBeInstanceOf(Date);
  });

  it('should not return tasks scheduled for other days', async () => {
    // Create task scheduled for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    await db.insert(tasksTable)
      .values({
        title: 'Tomorrow Task',
        scheduled_date: tomorrow,
        is_completed: false
      })
      .execute();

    // Create task scheduled for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(10, 0, 0, 0);

    await db.insert(tasksTable)
      .values({
        title: 'Yesterday Task',
        scheduled_date: yesterday,
        is_completed: false
      })
      .execute();

    const result = await getTodayTasks();

    expect(result).toHaveLength(0);
  });

  it('should not return tasks without scheduled_date', async () => {
    // Create task without scheduled_date
    await db.insert(tasksTable)
      .values({
        title: 'Unscheduled Task',
        is_completed: false
      })
      .execute();

    const result = await getTodayTasks();

    expect(result).toHaveLength(0);
  });

  it('should return multiple tasks scheduled for today with their respective tags', async () => {
    // Create tags
    const tagResults = await db.insert(tagsTable)
      .values([
        { name: 'personal', color: '#00ff00' },
        { name: 'urgent', color: '#ff0000' },
        { name: 'work', color: '#0000ff' }
      ])
      .returning()
      .execute();

    // Create tasks scheduled for today
    const today = new Date();
    today.setHours(9, 0, 0, 0);

    const taskResults = await db.insert(tasksTable)
      .values([
        {
          title: 'First Task',
          scheduled_date: today,
          is_completed: false
        },
        {
          title: 'Second Task',
          scheduled_date: new Date(today.getTime() + 3600000), // 1 hour later
          is_completed: false
        }
      ])
      .returning()
      .execute();

    // Associate different tags with each task
    await db.insert(taskTagsTable)
      .values([
        { task_id: taskResults[0].id, tag_id: tagResults[0].id }, // First task: personal
        { task_id: taskResults[1].id, tag_id: tagResults[1].id }, // Second task: urgent
        { task_id: taskResults[1].id, tag_id: tagResults[2].id }  // Second task: work
      ])
      .execute();

    const result = await getTodayTasks();

    expect(result).toHaveLength(2);
    
    // Check first task
    const firstTask = result.find(task => task.title === 'First Task');
    expect(firstTask).toBeDefined();
    expect(firstTask!.tags).toHaveLength(1);
    expect(firstTask!.tags[0].name).toEqual('personal');

    // Check second task
    const secondTask = result.find(task => task.title === 'Second Task');
    expect(secondTask).toBeDefined();
    expect(secondTask!.tags).toHaveLength(2);
    const secondTaskTagNames = secondTask!.tags.map((tag: any) => tag.name).sort();
    expect(secondTaskTagNames).toEqual(['urgent', 'work']);
  });

  it('should return empty array when no tasks are scheduled for today', async () => {
    const result = await getTodayTasks();
    expect(result).toHaveLength(0);
  });
});
