
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable, tasksTable, taskTagsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { deleteTag } from '../handlers/delete_tag';
import { eq } from 'drizzle-orm';

const testDeleteInput: DeleteInput = {
  id: 1
};

describe('deleteTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a tag', async () => {
    // Create a test tag
    const result = await db.insert(tagsTable)
      .values({
        name: 'Test Tag',
        color: '#ff0000'
      })
      .returning()
      .execute();

    const tagId = result[0].id;

    // Delete the tag
    await deleteTag({ id: tagId });

    // Verify tag is deleted
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, tagId))
      .execute();

    expect(tags).toHaveLength(0);
  });

  it('should not throw error when deleting non-existent tag', async () => {
    // Try to delete a tag that doesn't exist
    await expect(deleteTag({ id: 999 })).resolves.toBeUndefined();
  });

  it('should cascade delete task-tag relationships', async () => {
    // Create a test tag
    const tagResult = await db.insert(tagsTable)
      .values({
        name: 'Test Tag',
        color: '#ff0000'
      })
      .returning()
      .execute();

    const tagId = tagResult[0].id;

    // Create a test task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task'
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    // Create task-tag relationship
    await db.insert(taskTagsTable)
      .values({
        task_id: taskId,
        tag_id: tagId
      })
      .execute();

    // Verify the relationship exists
    const taskTagsBefore = await db.select()
      .from(taskTagsTable)
      .where(eq(taskTagsTable.tag_id, tagId))
      .execute();

    expect(taskTagsBefore).toHaveLength(1);

    // Delete the tag
    await deleteTag({ id: tagId });

    // Verify tag is deleted
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, tagId))
      .execute();

    expect(tags).toHaveLength(0);

    // Verify task-tag relationship is cascade deleted
    const taskTagsAfter = await db.select()
      .from(taskTagsTable)
      .where(eq(taskTagsTable.tag_id, tagId))
      .execute();

    expect(taskTagsAfter).toHaveLength(0);

    // Verify task still exists (only the relationship should be deleted)
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(1);
  });

  it('should handle multiple task-tag relationships', async () => {
    // Create a test tag
    const tagResult = await db.insert(tagsTable)
      .values({
        name: 'Popular Tag',
        color: '#00ff00'
      })
      .returning()
      .execute();

    const tagId = tagResult[0].id;

    // Create multiple test tasks
    const task1Result = await db.insert(tasksTable)
      .values({
        title: 'Task 1'
      })
      .returning()
      .execute();

    const task2Result = await db.insert(tasksTable)
      .values({
        title: 'Task 2'
      })
      .returning()
      .execute();

    const task1Id = task1Result[0].id;
    const task2Id = task2Result[0].id;

    // Create multiple task-tag relationships
    await db.insert(taskTagsTable)
      .values([
        { task_id: task1Id, tag_id: tagId },
        { task_id: task2Id, tag_id: tagId }
      ])
      .execute();

    // Verify relationships exist
    const taskTagsBefore = await db.select()
      .from(taskTagsTable)
      .where(eq(taskTagsTable.tag_id, tagId))
      .execute();

    expect(taskTagsBefore).toHaveLength(2);

    // Delete the tag
    await deleteTag({ id: tagId });

    // Verify tag is deleted
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, tagId))
      .execute();

    expect(tags).toHaveLength(0);

    // Verify all task-tag relationships are cascade deleted
    const taskTagsAfter = await db.select()
      .from(taskTagsTable)
      .where(eq(taskTagsTable.tag_id, tagId))
      .execute();

    expect(taskTagsAfter).toHaveLength(0);

    // Verify both tasks still exist
    const tasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(tasks).toHaveLength(2);
  });
});
