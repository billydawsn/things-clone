
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, taskTagsTable, areasTable, projectsTable, tagsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a task without tags', async () => {
    // Create test task
    const [task] = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        notes: 'A task for testing',
        is_completed: false
      })
      .returning()
      .execute();

    const input: DeleteInput = {
      id: task.id
    };

    // Delete the task
    await deleteTask(input);

    // Verify task is deleted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should delete a task with tags and remove tag relationships', async () => {
    // Create test tag
    const [tag] = await db.insert(tagsTable)
      .values({
        name: 'Test Tag',
        color: '#ff0000'
      })
      .returning()
      .execute();

    // Create test task
    const [task] = await db.insert(tasksTable)
      .values({
        title: 'Test Task with Tags',
        notes: 'A task with tags for testing',
        is_completed: false
      })
      .returning()
      .execute();

    // Create task-tag relationship
    await db.insert(taskTagsTable)
      .values({
        task_id: task.id,
        tag_id: tag.id
      })
      .execute();

    // Verify relationship exists before deletion
    const beforeTaskTags = await db.select()
      .from(taskTagsTable)
      .where(eq(taskTagsTable.task_id, task.id))
      .execute();
    expect(beforeTaskTags).toHaveLength(1);

    const input: DeleteInput = {
      id: task.id
    };

    // Delete the task
    await deleteTask(input);

    // Verify task is deleted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();
    expect(tasks).toHaveLength(0);

    // Verify task-tag relationships are deleted
    const afterTaskTags = await db.select()
      .from(taskTagsTable)
      .where(eq(taskTagsTable.task_id, task.id))
      .execute();
    expect(afterTaskTags).toHaveLength(0);

    // Verify tag still exists (should not be deleted)
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, tag.id))
      .execute();
    expect(tags).toHaveLength(1);
  });

  it('should delete a task with area and project associations', async () => {
    // Create test area
    const [area] = await db.insert(areasTable)
      .values({
        name: 'Test Area',
        color: '#00ff00'
      })
      .returning()
      .execute();

    // Create test project
    const [project] = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A project for testing',
        area_id: area.id,
        is_completed: false
      })
      .returning()
      .execute();

    // Create test task with area and project
    const [task] = await db.insert(tasksTable)
      .values({
        title: 'Test Task with Associations',
        notes: 'A task with area and project',
        area_id: area.id,
        project_id: project.id,
        is_completed: false,
        priority: 'high'
      })
      .returning()
      .execute();

    const input: DeleteInput = {
      id: task.id
    };

    // Delete the task
    await deleteTask(input);

    // Verify task is deleted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();
    expect(tasks).toHaveLength(0);

    // Verify area still exists (should not be deleted)
    const areas = await db.select()
      .from(areasTable)
      .where(eq(areasTable.id, area.id))
      .execute();
    expect(areas).toHaveLength(1);

    // Verify project still exists (should not be deleted)
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, project.id))
      .execute();
    expect(projects).toHaveLength(1);
  });

  it('should delete a task with multiple tags', async () => {
    // Create multiple test tags
    const [tag1] = await db.insert(tagsTable)
      .values({
        name: 'Tag 1',
        color: '#ff0000'
      })
      .returning()
      .execute();

    const [tag2] = await db.insert(tagsTable)
      .values({
        name: 'Tag 2',
        color: '#00ff00'
      })
      .returning()
      .execute();

    // Create test task
    const [task] = await db.insert(tasksTable)
      .values({
        title: 'Test Task with Multiple Tags',
        notes: 'A task with multiple tags',
        is_completed: false
      })
      .returning()
      .execute();

    // Create multiple task-tag relationships
    await db.insert(taskTagsTable)
      .values([
        { task_id: task.id, tag_id: tag1.id },
        { task_id: task.id, tag_id: tag2.id }
      ])
      .execute();

    // Verify relationships exist before deletion
    const beforeTaskTags = await db.select()
      .from(taskTagsTable)
      .where(eq(taskTagsTable.task_id, task.id))
      .execute();
    expect(beforeTaskTags).toHaveLength(2);

    const input: DeleteInput = {
      id: task.id
    };

    // Delete the task
    await deleteTask(input);

    // Verify task is deleted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))          
      .execute();
    expect(tasks).toHaveLength(0);

    // Verify all task-tag relationships are deleted
    const afterTaskTags = await db.select()
      .from(taskTagsTable)
      .where(eq(taskTagsTable.task_id, task.id))
      .execute();
    expect(afterTaskTags).toHaveLength(0);

    // Verify tags still exist (should not be deleted)
    const tags = await db.select()
      .from(tagsTable)
      .execute();
    expect(tags).toHaveLength(2);
  });

  it('should handle deletion of non-existent task gracefully', async () => {
    const input: DeleteInput = {
      id: 999999 // Non-existent ID
    };

    // Should not throw an error
    await deleteTask(input);

    // Verify no tasks were affected
    const tasks = await db.select()
      .from(tasksTable)
      .execute();
    expect(tasks).toHaveLength(0);
  });
});
