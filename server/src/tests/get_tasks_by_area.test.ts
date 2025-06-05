
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { areasTable, tasksTable, tagsTable, taskTagsTable } from '../db/schema';
import { type GetTasksByAreaInput } from '../schema';
import { getTasksByArea } from '../handlers/get_tasks_by_area';
import { eq } from 'drizzle-orm';

// Test input
const testInput: GetTasksByAreaInput = {
  area_id: 1
};

describe('getTasksByArea', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist for area', async () => {
    // Create area but no tasks
    await db.insert(areasTable).values({
      name: 'Test Area',
      color: '#FF0000'
    }).execute();

    const result = await getTasksByArea(testInput);

    expect(result).toEqual([]);
  });

  it('should return tasks for specified area', async () => {
    // Create area
    await db.insert(areasTable).values({
      id: 1,
      name: 'Test Area',
      color: '#FF0000'
    }).execute();

    // Create task in the area
    await db.insert(tasksTable).values({
      title: 'Test Task',
      notes: 'Task notes',
      area_id: 1,
      priority: 'high'
    }).execute();

    const result = await getTasksByArea(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Test Task');
    expect(result[0].notes).toEqual('Task notes');
    expect(result[0].area_id).toEqual(1);
    expect(result[0].priority).toEqual('high');
    expect(result[0].tags).toEqual([]);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return tasks with associated tags', async () => {
    // Create area
    await db.insert(areasTable).values({
      id: 1,
      name: 'Test Area',
      color: '#FF0000'
    }).execute();

    // Create tags
    const tagsResult = await db.insert(tagsTable).values([
      { name: 'urgent', color: '#FF0000' },
      { name: 'work', color: '#0000FF' }
    ]).returning().execute();

    // Create task
    const taskResult = await db.insert(tasksTable).values({
      title: 'Test Task',
      area_id: 1,
      priority: 'medium'
    }).returning().execute();

    const taskId = taskResult[0].id;
    const urgentTagId = tagsResult[0].id;
    const workTagId = tagsResult[1].id;

    // Associate tags with task
    await db.insert(taskTagsTable).values([
      { task_id: taskId, tag_id: urgentTagId },
      { task_id: taskId, tag_id: workTagId }
    ]).execute();

    const result = await getTasksByArea(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Test Task');
    expect(result[0].area_id).toEqual(1);
    expect(result[0].tags).toHaveLength(2);

    // Check tags are properly formatted
    const tagNames = result[0].tags.map(tag => tag.name).sort();
    expect(tagNames).toEqual(['urgent', 'work']);

    const urgentTag = result[0].tags.find(tag => tag.name === 'urgent');
    expect(urgentTag).toBeDefined();
    expect(urgentTag!.color).toEqual('#FF0000');
    expect(urgentTag!.id).toEqual(urgentTagId);
    expect(urgentTag!.created_at).toBeInstanceOf(Date);

    const workTag = result[0].tags.find(tag => tag.name === 'work');
    expect(workTag).toBeDefined();
    expect(workTag!.color).toEqual('#0000FF');
    expect(workTag!.id).toEqual(workTagId);
  });

  it('should return multiple tasks with different tag combinations', async () => {
    // Create area
    await db.insert(areasTable).values({
      id: 1,
      name: 'Test Area'
    }).execute();

    // Create tags
    const tagsResult = await db.insert(tagsTable).values([
      { name: 'urgent', color: '#FF0000' },
      { name: 'work', color: '#0000FF' },
      { name: 'personal', color: '#00FF00' }
    ]).returning().execute();

    // Create tasks
    const tasksResult = await db.insert(tasksTable).values([
      { title: 'Task 1', area_id: 1 },
      { title: 'Task 2', area_id: 1 },
      { title: 'Task 3', area_id: 1 }
    ]).returning().execute();

    // Associate different tags with tasks
    await db.insert(taskTagsTable).values([
      // Task 1: urgent + work
      { task_id: tasksResult[0].id, tag_id: tagsResult[0].id },
      { task_id: tasksResult[0].id, tag_id: tagsResult[1].id },
      // Task 2: personal only
      { task_id: tasksResult[1].id, tag_id: tagsResult[2].id },
      // Task 3: no tags
    ]).execute();

    const result = await getTasksByArea(testInput);

    expect(result).toHaveLength(3);

    // Task 1 should have 2 tags
    const task1 = result.find(task => task.title === 'Task 1');
    expect(task1!.tags).toHaveLength(2);
    expect(task1!.tags.map(tag => tag.name).sort()).toEqual(['urgent', 'work']);

    // Task 2 should have 1 tag
    const task2 = result.find(task => task.title === 'Task 2');
    expect(task2!.tags).toHaveLength(1);
    expect(task2!.tags[0].name).toEqual('personal');

    // Task 3 should have no tags
    const task3 = result.find(task => task.title === 'Task 3');
    expect(task3!.tags).toHaveLength(0);
  });

  it('should not return tasks from other areas', async () => {
    // Create two areas
    await db.insert(areasTable).values([
      { id: 1, name: 'Area 1' },
      { id: 2, name: 'Area 2' }
    ]).execute();

    // Create tasks in different areas
    await db.insert(tasksTable).values([
      { title: 'Task in Area 1', area_id: 1 },
      { title: 'Task in Area 2', area_id: 2 }
    ]).execute();

    const result = await getTasksByArea(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Task in Area 1');
    expect(result[0].area_id).toEqual(1);
  });

  it('should handle null date fields correctly', async () => {
    // Create area
    await db.insert(areasTable).values({
      id: 1,
      name: 'Test Area'
    }).execute();

    // Create task with null date fields
    await db.insert(tasksTable).values({
      title: 'Task with nulls',
      area_id: 1,
      notes: null,
      due_date: null,
      deadline_date: null,
      scheduled_date: null,
      completed_at: null,
      priority: null
    }).execute();

    const result = await getTasksByArea(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].notes).toBeNull();
    expect(result[0].due_date).toBeNull();
    expect(result[0].deadline_date).toBeNull();
    expect(result[0].scheduled_date).toBeNull();
    expect(result[0].completed_at).toBeNull();
    expect(result[0].priority).toBeNull();
    expect(result[0].tags).toEqual([]);
  });
});
