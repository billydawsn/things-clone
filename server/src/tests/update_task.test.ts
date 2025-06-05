
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { areasTable, projectsTable, tasksTable, tagsTable, taskTagsTable } from '../db/schema';
import { type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update basic task fields', async () => {
    // Create a task first
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Original Task',
        notes: 'Original notes',
        priority: 'low'
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    const updateInput: UpdateTaskInput = {
      id: taskId,
      title: 'Updated Task',
      notes: 'Updated notes',
      priority: 'high'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(taskId);
    expect(result.title).toEqual('Updated Task');
    expect(result.notes).toEqual('Updated notes');
    expect(result.priority).toEqual('high');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle task completion', async () => {
    // Create a task first
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        is_completed: false
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    const updateInput: UpdateTaskInput = {
      id: taskId,
      is_completed: true
    };

    const result = await updateTask(updateInput);

    expect(result.is_completed).toBe(true);
    expect(result.completed_at).toBeInstanceOf(Date);
  });

  it('should clear completed_at when marking task as incomplete', async () => {
    // Create a completed task first
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        is_completed: true,
        completed_at: new Date()
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    const updateInput: UpdateTaskInput = {
      id: taskId,
      is_completed: false
    };

    const result = await updateTask(updateInput);

    expect(result.is_completed).toBe(false);
    expect(result.completed_at).toBeNull();
  });

  it('should update task with area and project references', async () => {
    // Create area and project first
    const areaResult = await db.insert(areasTable)
      .values({ name: 'Test Area' })
      .returning()
      .execute();

    const projectResult = await db.insert(projectsTable)
      .values({ 
        name: 'Test Project',
        area_id: areaResult[0].id
      })
      .returning()
      .execute();

    // Create a task
    const taskResult = await db.insert(tasksTable)
      .values({ title: 'Test Task' })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    const updateInput: UpdateTaskInput = {
      id: taskId,
      area_id: areaResult[0].id,
      project_id: projectResult[0].id,
      due_date: new Date('2024-12-31'),
      scheduled_date: new Date('2024-12-25')
    };

    const result = await updateTask(updateInput);

    expect(result.area_id).toEqual(areaResult[0].id);
    expect(result.project_id).toEqual(projectResult[0].id);
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.scheduled_date).toBeInstanceOf(Date);
  });

  it('should update task with tag associations', async () => {
    // Create tags first
    const tag1Result = await db.insert(tagsTable)
      .values({ name: 'Tag 1', color: '#red' })
      .returning()
      .execute();

    const tag2Result = await db.insert(tagsTable)
      .values({ name: 'Tag 2', color: '#blue' })
      .returning()
      .execute();

    // Create a task
    const taskResult = await db.insert(tasksTable)
      .values({ title: 'Test Task' })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    const updateInput: UpdateTaskInput = {
      id: taskId,
      title: 'Updated Task with Tags',
      tag_ids: [tag1Result[0].id, tag2Result[0].id]
    };

    const result = await updateTask(updateInput);

    expect(result.title).toEqual('Updated Task with Tags');

    // Verify tag associations were created
    const taskTags = await db.select()
      .from(taskTagsTable)
      .where(eq(taskTagsTable.task_id, taskId))
      .execute();

    expect(taskTags).toHaveLength(2);
    expect(taskTags.map(tt => tt.tag_id)).toContain(tag1Result[0].id);
    expect(taskTags.map(tt => tt.tag_id)).toContain(tag2Result[0].id);
  });

  it('should replace existing tag associations', async () => {
    // Create tags
    const tag1Result = await db.insert(tagsTable)
      .values({ name: 'Tag 1' })
      .returning()
      .execute();

    const tag2Result = await db.insert(tagsTable)
      .values({ name: 'Tag 2' })
      .returning()
      .execute();

    const tag3Result = await db.insert(tagsTable)
      .values({ name: 'Tag 3' })
      .returning()
      .execute();

    // Create a task with initial tags
    const taskResult = await db.insert(tasksTable)
      .values({ title: 'Test Task' })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    // Add initial tag associations
    await db.insert(taskTagsTable)
      .values([
        { task_id: taskId, tag_id: tag1Result[0].id },
        { task_id: taskId, tag_id: tag2Result[0].id }
      ])
      .execute();

    // Update with new tags
    const updateInput: UpdateTaskInput = {
      id: taskId,
      tag_ids: [tag2Result[0].id, tag3Result[0].id] // Keep tag2, replace tag1 with tag3
    };

    await updateTask(updateInput);

    // Verify tag associations were replaced
    const taskTags = await db.select()
      .from(taskTagsTable)
      .where(eq(taskTagsTable.task_id, taskId))
      .execute();

    expect(taskTags).toHaveLength(2);
    expect(taskTags.map(tt => tt.tag_id)).toContain(tag2Result[0].id);
    expect(taskTags.map(tt => tt.tag_id)).toContain(tag3Result[0].id);
    expect(taskTags.map(tt => tt.tag_id)).not.toContain(tag1Result[0].id);
  });

  it('should remove all tag associations when empty array provided', async () => {
    // Create tags
    const tag1Result = await db.insert(tagsTable)
      .values({ name: 'Tag 1' })
      .returning()
      .execute();

    // Create a task with initial tags
    const taskResult = await db.insert(tasksTable)
      .values({ title: 'Test Task' })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    // Add initial tag association
    await db.insert(taskTagsTable)
      .values({ task_id: taskId, tag_id: tag1Result[0].id })
      .execute();

    // Update with empty tag array
    const updateInput: UpdateTaskInput = {
      id: taskId,
      tag_ids: []
    };

    await updateTask(updateInput);

    // Verify all tag associations were removed
    const taskTags = await db.select()
      .from(taskTagsTable)
      .where(eq(taskTagsTable.task_id, taskId))
      .execute();

    expect(taskTags).toHaveLength(0);
  });

  it('should not modify tags when tag_ids is not provided', async () => {
    // Create tags
    const tag1Result = await db.insert(tagsTable)
      .values({ name: 'Tag 1' })
      .returning()
      .execute();

    // Create a task with initial tags
    const taskResult = await db.insert(tasksTable)
      .values({ title: 'Test Task' })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    // Add initial tag association
    await db.insert(taskTagsTable)
      .values({ task_id: taskId, tag_id: tag1Result[0].id })
      .execute();

    // Update without specifying tag_ids
    const updateInput: UpdateTaskInput = {
      id: taskId,
      title: 'Updated Title'
    };

    await updateTask(updateInput);

    // Verify tag associations remain unchanged
    const taskTags = await db.select()
      .from(taskTagsTable)
      .where(eq(taskTagsTable.task_id, taskId))
      .execute();

    expect(taskTags).toHaveLength(1);
    expect(taskTags[0].tag_id).toEqual(tag1Result[0].id);
  });

  it('should save updated task to database', async () => {
    // Create a task first
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Original Task',
        notes: 'Original notes'
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    const updateInput: UpdateTaskInput = {
      id: taskId,
      title: 'Database Updated Task',
      notes: 'Database updated notes'
    };

    await updateTask(updateInput);

    // Query database to verify changes were persisted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Database Updated Task');
    expect(tasks[0].notes).toEqual('Database updated notes');
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when task not found', async () => {
    const updateInput: UpdateTaskInput = {
      id: 99999, // Non-existent ID
      title: 'Updated Task'
    };

    await expect(updateTask(updateInput)).rejects.toThrow(/Task with id 99999 not found/i);
  });
});
