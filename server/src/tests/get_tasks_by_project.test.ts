
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { areasTable, projectsTable, tasksTable, tagsTable, taskTagsTable } from '../db/schema';
import { type GetTasksByProjectInput } from '../schema';
import { getTasksByProject, type TaskWithTags } from '../handlers/get_tasks_by_project';

describe('getTasksByProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return tasks for a specific project', async () => {
    // Create test area
    const areaResult = await db.insert(areasTable)
      .values({
        name: 'Test Area',
        color: '#blue'
      })
      .returning()
      .execute();
    const area = areaResult[0];

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A project for testing',
        area_id: area.id,
        color: '#red'
      })
      .returning()
      .execute();
    const project = projectResult[0];

    // Create test tasks
    const task1Result = await db.insert(tasksTable)
      .values({
        title: 'Task 1',
        notes: 'First task',
        project_id: project.id,
        area_id: area.id,
        priority: 'high'
      })
      .returning()
      .execute();

    const task2Result = await db.insert(tasksTable)
      .values({
        title: 'Task 2',
        notes: 'Second task',
        project_id: project.id,
        priority: 'low'
      })
      .returning()
      .execute();

    const input: GetTasksByProjectInput = {
      project_id: project.id
    };

    const result = await getTasksByProject(input);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Task 1');
    expect(result[0].project_id).toEqual(project.id);
    expect(result[0].tags).toEqual([]);
    expect(result[1].title).toEqual('Task 2');
    expect(result[1].project_id).toEqual(project.id);
    expect(result[1].tags).toEqual([]);
  });

  it('should return tasks with associated tags', async () => {
    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A project for testing'
      })
      .returning()
      .execute();
    const project = projectResult[0];

    // Create test tags
    const tag1Result = await db.insert(tagsTable)
      .values({
        name: 'urgent',
        color: '#red'
      })
      .returning()
      .execute();

    const tag2Result = await db.insert(tagsTable)
      .values({
        name: 'work',
        color: '#blue'
      })
      .returning()
      .execute();

    const tag1 = tag1Result[0];
    const tag2 = tag2Result[0];

    // Create test task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Tagged Task',
        notes: 'Task with tags',
        project_id: project.id,
        priority: 'medium'
      })
      .returning()
      .execute();
    const task = taskResult[0];

    // Associate tags with task
    await db.insert(taskTagsTable)
      .values([
        { task_id: task.id, tag_id: tag1.id },
        { task_id: task.id, tag_id: tag2.id }
      ])
      .execute();

    const input: GetTasksByProjectInput = {
      project_id: project.id
    };

    const result = await getTasksByProject(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Tagged Task');
    expect(result[0].tags).toHaveLength(2);
    
    // Check that tags are properly structured
    const tagNames = result[0].tags.map((tag) => tag.name).sort();
    expect(tagNames).toEqual(['urgent', 'work']);
    
    const urgentTag = result[0].tags.find((tag) => tag.name === 'urgent');
    expect(urgentTag).toBeDefined();
    expect(urgentTag?.color).toEqual('#red');
    expect(urgentTag?.id).toEqual(tag1.id);
    expect(urgentTag?.created_at).toBeInstanceOf(Date);
  });

  it('should return empty array when project has no tasks', async () => {
    // Create test project with no tasks
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Empty Project',
        description: 'Project with no tasks'
      })
      .returning()
      .execute();
    const project = projectResult[0];

    const input: GetTasksByProjectInput = {
      project_id: project.id
    };

    const result = await getTasksByProject(input);

    expect(result).toHaveLength(0);
  });

  it('should return tasks without tags when they have no associated tags', async () => {
    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A project for testing'
      })
      .returning()
      .execute();
    const project = projectResult[0];

    // Create task without tags
    await db.insert(tasksTable)
      .values({
        title: 'Untagged Task',
        notes: 'Task without tags',
        project_id: project.id,
        priority: 'low'
      })
      .execute();

    const input: GetTasksByProjectInput = {
      project_id: project.id
    };

    const result = await getTasksByProject(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Untagged Task');
    expect(result[0].tags).toEqual([]);
  });

  it('should handle multiple tasks with different tag combinations', async () => {
    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A project for testing'
      })
      .returning()
      .execute();
    const project = projectResult[0];

    // Create test tags
    const urgentTagResult = await db.insert(tagsTable)
      .values({
        name: 'urgent',
        color: '#red'
      })
      .returning()
      .execute();

    const workTagResult = await db.insert(tagsTable)
      .values({
        name: 'work',
        color: '#blue'
      })
      .returning()
      .execute();

    const personalTagResult = await db.insert(tagsTable)
      .values({
        name: 'personal',
        color: '#green'
      })
      .returning()
      .execute();

    const urgentTag = urgentTagResult[0];
    const workTag = workTagResult[0];
    const personalTag = personalTagResult[0];

    // Create test tasks
    const task1Result = await db.insert(tasksTable)
      .values({
        title: 'Task with urgent and work tags',
        project_id: project.id,
        priority: 'high'
      })
      .returning()
      .execute();

    const task2Result = await db.insert(tasksTable)
      .values({
        title: 'Task with personal tag',
        project_id: project.id,
        priority: 'medium'
      })
      .returning()
      .execute();

    const task3Result = await db.insert(tasksTable)
      .values({
        title: 'Task with no tags',
        project_id: project.id,
        priority: 'low'
      })
      .returning()
      .execute();

    const task1 = task1Result[0];
    const task2 = task2Result[0];

    // Associate tags with tasks
    await db.insert(taskTagsTable)
      .values([
        { task_id: task1.id, tag_id: urgentTag.id },
        { task_id: task1.id, tag_id: workTag.id },
        { task_id: task2.id, tag_id: personalTag.id }
      ])
      .execute();

    const input: GetTasksByProjectInput = {
      project_id: project.id
    };

    const result = await getTasksByProject(input);

    expect(result).toHaveLength(3);

    // Find tasks by title
    const taggedTask1 = result.find(t => t.title === 'Task with urgent and work tags');
    const taggedTask2 = result.find(t => t.title === 'Task with personal tag');
    const untaggedTask = result.find(t => t.title === 'Task with no tags');

    // Verify task 1 has 2 tags
    expect(taggedTask1?.tags).toHaveLength(2);
    const task1TagNames = taggedTask1?.tags.map((tag) => tag.name).sort();
    expect(task1TagNames).toEqual(['urgent', 'work']);

    // Verify task 2 has 1 tag
    expect(taggedTask2?.tags).toHaveLength(1);
    expect(taggedTask2?.tags[0].name).toEqual('personal');
    expect(taggedTask2?.tags[0].color).toEqual('#green');

    // Verify task 3 has no tags
    expect(untaggedTask?.tags).toEqual([]);
  });
});
