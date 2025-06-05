
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, areasTable } from '../db/schema';
import { getProjects } from '../handlers/get_projects';

describe('getProjects', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no projects exist', async () => {
    const result = await getProjects();
    expect(result).toEqual([]);
  });

  it('should return all projects with correct properties', async () => {
    // Create test area first
    const areaResult = await db.insert(areasTable)
      .values({
        name: 'Test Area',
        color: '#ff0000'
      })
      .returning()
      .execute();

    const area = areaResult[0];

    // Create test projects
    await db.insert(projectsTable)
      .values([
        {
          name: 'Project 1',
          description: 'First test project',
          area_id: area.id,
          color: '#blue',
          is_completed: false
        },
        {
          name: 'Project 2',
          description: null,
          area_id: null,
          color: null,
          is_completed: true
        }
      ])
      .execute();

    const result = await getProjects();

    expect(result).toHaveLength(2);
    
    // Check first project
    const project1 = result.find(p => p.name === 'Project 1');
    expect(project1).toBeDefined();
    expect(project1?.name).toBe('Project 1');
    expect(project1?.description).toBe('First test project');
    expect(project1?.area_id).toBe(area.id);
    expect(project1?.color).toBe('#blue');
    expect(project1?.is_completed).toBe(false);
    expect(project1?.completed_at).toBeNull();
    expect(project1?.id).toBeDefined();
    expect(project1?.created_at).toBeInstanceOf(Date);
    expect(project1?.updated_at).toBeInstanceOf(Date);

    // Check second project
    const project2 = result.find(p => p.name === 'Project 2');
    expect(project2).toBeDefined();
    expect(project2?.name).toBe('Project 2');
    expect(project2?.description).toBeNull();
    expect(project2?.area_id).toBeNull();
    expect(project2?.color).toBeNull();
    expect(project2?.is_completed).toBe(true);
    expect(project2?.completed_at).toBeNull(); // completed_at is not set automatically
    expect(project2?.id).toBeDefined();
    expect(project2?.created_at).toBeInstanceOf(Date);
    expect(project2?.updated_at).toBeInstanceOf(Date);
  });

  it('should handle projects with and without areas correctly', async () => {
    // Create area
    const areaResult = await db.insert(areasTable)
      .values({
        name: 'Work Area',
        color: '#green'
      })
      .returning()
      .execute();

    // Create projects - one with area, one without
    await db.insert(projectsTable)
      .values([
        {
          name: 'Work Project',
          description: 'Project with area',
          area_id: areaResult[0].id,
          is_completed: false
        },
        {
          name: 'Personal Project',
          description: 'Project without area',
          area_id: null,
          is_completed: false
        }
      ])
      .execute();

    const result = await getProjects();

    expect(result).toHaveLength(2);

    const workProject = result.find(p => p.name === 'Work Project');
    const personalProject = result.find(p => p.name === 'Personal Project');

    expect(workProject?.area_id).toBe(areaResult[0].id);
    expect(personalProject?.area_id).toBeNull();
  });

  it('should return projects ordered by creation date', async () => {
    // Create multiple projects with slight delay to ensure different timestamps
    await db.insert(projectsTable)
      .values({
        name: 'First Project',
        description: 'Created first',
        is_completed: false
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(projectsTable)
      .values({
        name: 'Second Project',
        description: 'Created second',
        is_completed: false
      })
      .execute();

    const result = await getProjects();
    
    expect(result).toHaveLength(2);
    
    // Verify all projects are returned
    const projectNames = result.map(p => p.name);
    expect(projectNames).toContain('First Project');
    expect(projectNames).toContain('Second Project');
  });

  it('should handle completed projects correctly', async () => {
    const completedAt = new Date();
    
    await db.insert(projectsTable)
      .values({
        name: 'Completed Project',
        description: 'This project is done',
        is_completed: true,
        completed_at: completedAt
      })
      .execute();

    const result = await getProjects();
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Completed Project');
    expect(result[0].is_completed).toBe(true);
    expect(result[0].completed_at).toEqual(completedAt);
  });
});
