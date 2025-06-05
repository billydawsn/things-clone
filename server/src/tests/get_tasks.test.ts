
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { areasTable, projectsTable, tasksTable, tagsTable, taskTagsTable } from '../db/schema';
import { getTasks, type TaskWithTags } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();
    expect(result).toEqual([]);
  });

  it('should return tasks without tags', async () => {
    // Create a simple task without tags
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        notes: 'Test notes',
        is_completed: false
      })
      .returning()
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Test Task');
    expect(result[0].notes).toEqual('Test notes');
    expect(result[0].is_completed).toEqual(false);
    expect(result[0].tags).toEqual([]);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return tasks with associated tags', async () => {
    // Create tags
    const tagResults = await db.insert(tagsTable)
      .values([
        { name: 'urgent', color: 'red' },
        { name: 'work', color: 'blue' }
      ])
      .returning()
      .execute();

    // Create task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Tagged Task',
        notes: 'Task with tags',
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

    const result = await getTasks();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Tagged Task');
    expect(result[0].tags).toHaveLength(2);
    
    // Check tags are properly included
    const tagNames = result[0].tags.map((tag: any) => tag.name).sort();
    expect(tagNames).toEqual(['urgent', 'work']);
    
    const urgentTag = result[0].tags.find((tag: any) => tag.name === 'urgent');
    expect(urgentTag).toBeDefined();
    expect(urgentTag!.color).toEqual('red');
    expect(urgentTag!.id).toBeDefined();
    expect(urgentTag!.created_at).toBeInstanceOf(Date);
  });

  it('should return multiple tasks with different tag combinations', async () => {
    // Create tags
    const tagResults = await db.insert(tagsTable)
      .values([
        { name: 'urgent', color: 'red' },
        { name: 'work', color: 'blue' },
        { name: 'personal', color: 'green' }
      ])
      .returning()
      .execute();

    // Create multiple tasks
    const taskResults = await db.insert(tasksTable)
      .values([
        { title: 'Task 1', is_completed: false },
        { title: 'Task 2', is_completed: true },
        { title: 'Task 3', is_completed: false }
      ])
      .returning()
      .execute();

    // Associate different tags with different tasks
    await db.insert(taskTagsTable)
      .values([
        // Task 1: urgent + work
        { task_id: taskResults[0].id, tag_id: tagResults[0].id },
        { task_id: taskResults[0].id, tag_id: tagResults[1].id },
        // Task 2: no tags
        // Task 3: personal only
        { task_id: taskResults[2].id, tag_id: tagResults[2].id }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    
    // Find each task by title
    const task1 = result.find(task => task.title === 'Task 1');
    const task2 = result.find(task => task.title === 'Task 2');
    const task3 = result.find(task => task.title === 'Task 3');

    expect(task1).toBeDefined();
    expect(task1!.tags).toHaveLength(2);
    expect(task1!.tags.map((tag: any) => tag.name).sort()).toEqual(['urgent', 'work']);

    expect(task2).toBeDefined();
    expect(task2!.tags).toHaveLength(0);

    expect(task3).toBeDefined();
    expect(task3!.tags).toHaveLength(1);
    expect(task3!.tags[0].name).toEqual('personal');
    expect(task3!.tags[0].color).toEqual('green');
  });

  it('should return tasks ordered by created_at descending', async () => {
    // Create tasks with slight delay to ensure different timestamps
    const task1Result = await db.insert(tasksTable)
      .values({ title: 'First Task', is_completed: false })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const task2Result = await db.insert(tasksTable)
      .values({ title: 'Second Task', is_completed: false })
      .returning()
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    // Most recent task should be first (descending order)
    expect(result[0].title).toEqual('Second Task');
    expect(result[1].title).toEqual('First Task');
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });

  it('should handle tasks with area and project associations', async () => {
    // Create area and project
    const areaResult = await db.insert(areasTable)
      .values({ name: 'Work Area', color: 'blue' })
      .returning()
      .execute();

    const projectResult = await db.insert(projectsTable)
      .values({ 
        name: 'Test Project', 
        area_id: areaResult[0].id,
        is_completed: false 
      })
      .returning()
      .execute();

    // Create tag
    const tagResult = await db.insert(tagsTable)
      .values({ name: 'important', color: 'yellow' })
      .returning()
      .execute();

    // Create task with area, project, and tag
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Complex Task',
        area_id: areaResult[0].id,
        project_id: projectResult[0].id,
        is_completed: false
      })
      .returning()
      .execute();

    // Associate tag with task
    await db.insert(taskTagsTable)
      .values({ task_id: taskResult[0].id, tag_id: tagResult[0].id })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Complex Task');
    expect(result[0].area_id).toEqual(areaResult[0].id);
    expect(result[0].project_id).toEqual(projectResult[0].id);
    expect(result[0].tags).toHaveLength(1);
    expect(result[0].tags[0].name).toEqual('important');
    expect(result[0].tags[0].color).toEqual('yellow');
  });
});
