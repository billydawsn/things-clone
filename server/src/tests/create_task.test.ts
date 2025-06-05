
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, areasTable, projectsTable, tagsTable, taskTagsTable } from '../db/schema';
import { type CreateTaskInput, type Tag } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Extended type for testing
type TaskWithTags = {
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
  tags: Tag[];
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task without tags', async () => {
    const testInput: CreateTaskInput = {
      title: 'Test Task',
      notes: 'A task for testing',
      priority: 'high'
    };

    const result = await createTask(testInput) as TaskWithTags;

    expect(result.title).toEqual('Test Task');
    expect(result.notes).toEqual('A task for testing');
    expect(result.priority).toEqual('high');
    expect(result.is_completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.tags).toEqual([]);
  });

  it('should create a task with tags', async () => {
    // Create test tags first
    const tag1Result = await db.insert(tagsTable)
      .values({ name: 'Urgent', color: '#ff0000' })
      .returning()
      .execute();
    
    const tag2Result = await db.insert(tagsTable)
      .values({ name: 'Work', color: '#0000ff' })
      .returning()
      .execute();

    const tag1 = tag1Result[0];
    const tag2 = tag2Result[0];

    const testInput: CreateTaskInput = {
      title: 'Test Task with Tags',
      notes: 'A task with multiple tags',
      priority: 'medium',
      tag_ids: [tag1.id, tag2.id]
    };

    const result = await createTask(testInput) as TaskWithTags;

    expect(result.title).toEqual('Test Task with Tags');
    expect(result.notes).toEqual('A task with multiple tags');
    expect(result.priority).toEqual('medium');
    expect(result.tags).toHaveLength(2);
    
    const tagNames = result.tags.map((tag: Tag) => tag.name);
    expect(tagNames).toContain('Urgent');
    expect(tagNames).toContain('Work');
    
    const urgentTag = result.tags.find((tag: Tag) => tag.name === 'Urgent');
    expect(urgentTag?.color).toEqual('#ff0000');
  });

  it('should save task to database', async () => {
    const testInput: CreateTaskInput = {
      title: 'Database Test Task',
      notes: 'Testing database persistence',
      priority: 'low'
    };

    const result = await createTask(testInput);

    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Database Test Task');
    expect(tasks[0].notes).toEqual('Testing database persistence');
    expect(tasks[0].priority).toEqual('low');
    expect(tasks[0].is_completed).toEqual(false);
  });

  it('should save task-tag relationships to database', async () => {
    // Create test tag
    const tagResult = await db.insert(tagsTable)
      .values({ name: 'Important', color: '#00ff00' })
      .returning()
      .execute();

    const tag = tagResult[0];

    const testInput: CreateTaskInput = {
      title: 'Task with Relationship',
      tag_ids: [tag.id]
    };

    const result = await createTask(testInput);

    const taskTags = await db.select()
      .from(taskTagsTable)
      .where(eq(taskTagsTable.task_id, result.id))
      .execute();

    expect(taskTags).toHaveLength(1);
    expect(taskTags[0].tag_id).toEqual(tag.id);
  });

  it('should throw error for non-existent project_id', async () => {
    const testInput: CreateTaskInput = {
      title: 'Task with Invalid Project',
      project_id: 999
    };

    expect(createTask(testInput)).rejects.toThrow(/project with id 999 does not exist/i);
  });

  it('should throw error for non-existent area_id', async () => {
    const testInput: CreateTaskInput = {
      title: 'Task with Invalid Area',
      area_id: 999
    };

    expect(createTask(testInput)).rejects.toThrow(/area with id 999 does not exist/i);
  });

  it('should throw error for non-existent tag_ids', async () => {
    const testInput: CreateTaskInput = {
      title: 'Task with Invalid Tags',
      tag_ids: [999, 1000]
    };

    expect(createTask(testInput)).rejects.toThrow(/tags with ids 999, 1000 do not exist/i);
  });

  it('should create task with valid foreign key references', async () => {
    // Create test area
    const areaResult = await db.insert(areasTable)
      .values({ name: 'Test Area', color: '#123456' })
      .returning()
      .execute();

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({ name: 'Test Project', area_id: areaResult[0].id })
      .returning()
      .execute();

    // Create test tag
    const tagResult = await db.insert(tagsTable)
      .values({ name: 'Test Tag' })
      .returning()
      .execute();

    const testInput: CreateTaskInput = {
      title: 'Task with All References',
      notes: 'Complete task with all foreign keys',
      project_id: projectResult[0].id,
      area_id: areaResult[0].id,
      priority: 'high',
      due_date: new Date('2024-12-31'),
      tag_ids: [tagResult[0].id]
    };

    const result = await createTask(testInput) as TaskWithTags;

    expect(result.title).toEqual('Task with All References');
    expect(result.project_id).toEqual(projectResult[0].id);
    expect(result.area_id).toEqual(areaResult[0].id);
    expect(result.priority).toEqual('high');
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].name).toEqual('Test Tag');
  });
});
