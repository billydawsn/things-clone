
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { trpc } from '@/utils/trpc';
import type { 
  Task, 
  Area, 
  Project, 
  Tag,
  CreateTaskInput, 
  CreateAreaInput, 
  CreateProjectInput,
  UpdateTaskInput,
  UpdateAreaInput,
  UpdateProjectInput
} from '../../server/src/schema';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  Folder, 
  Circle, 
  Star,
  AlertCircle,
  List,
  Edit2,
  Trash2,
  MoreHorizontal,
  Tag as TagIcon
} from 'lucide-react';

// Extended Task type to handle tags from backend
interface TaskWithTags extends Omit<Task, 'tags'> {
  tags?: Tag[];
}

function App() {
  // State management
  const [tasks, setTasks] = useState<TaskWithTags[]>([]);
  const [todayTasks, setTodayTasks] = useState<TaskWithTags[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeView, setActiveView] = useState<'today' | 'all' | 'area' | 'project'>('today');
  const [isLoading, setIsLoading] = useState(false);

  // Dialog states
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isAreaDialogOpen, setIsAreaDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [isEditAreaDialogOpen, setIsEditAreaDialogOpen] = useState(false);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  
  // Form states
  const [taskForm, setTaskForm] = useState<CreateTaskInput>({
    title: '',
    notes: null,
    project_id: null,
    area_id: null,
    due_date: null,
    deadline_date: null,
    scheduled_date: null,
    priority: null,
    tag_ids: []
  });

  const [editTaskForm, setEditTaskForm] = useState<UpdateTaskInput>({
    id: 0,
    title: '',
    notes: null,
    project_id: null,
    area_id: null,
    due_date: null,
    deadline_date: null,
    scheduled_date: null,
    priority: null,
    tag_ids: []
  });

  const [areaForm, setAreaForm] = useState<CreateAreaInput>({
    name: '',
    color: null
  });

  const [editAreaForm, setEditAreaForm] = useState<UpdateAreaInput>({
    id: 0,
    name: '',
    color: null
  });

  const [projectForm, setProjectForm] = useState<CreateProjectInput>({
    name: '',
    description: null,
    area_id: null,
    color: null
  });

  const [editProjectForm, setEditProjectForm] = useState<UpdateProjectInput>({
    id: 0,
    name: '',
    description: null,
    area_id: null,
    color: null
  });

  // Load data functions
  const loadTasks = useCallback(async () => {
    try {
      const result = await trpc.getTasks.query();
      setTasks(result as TaskWithTags[]);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []);

  const loadTodayTasks = useCallback(async () => {
    try {
      const result = await trpc.getTodayTasks.query();
      setTodayTasks(result as TaskWithTags[]);
    } catch (error) {
      console.error('Failed to load today tasks:', error);
    }
  }, []);

  const loadAreas = useCallback(async () => {
    try {
      const result = await trpc.getAreas.query();
      setAreas(result);
    } catch (error) {
      console.error('Failed to load areas:', error);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const result = await trpc.getProjects.query();
      setProjects(result);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }, []);

  const loadTags = useCallback(async () => {
    try {
      const result = await trpc.getTags.query();
      setTags(result);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }, []);

  const loadAreaTasks = useCallback(async (areaId: number) => {
    try {
      const result = await trpc.getTasksByArea.query({ area_id: areaId });
      setTasks(result as TaskWithTags[]);
    } catch (error) {
      console.error('Failed to load area tasks:', error);
    }
  }, []);

  const loadProjectTasks = useCallback(async (projectId: number) => {
    try {
      const result = await trpc.getTasksByProject.query({ project_id: projectId });
      setTasks(result as TaskWithTags[]);
    } catch (error) {
      console.error('Failed to load project tasks:', error);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    loadTasks();
    loadTodayTasks();
    loadAreas();
    loadProjects();
    loadTags();
  }, [loadTasks, loadTodayTasks, loadAreas, loadProjects, loadTags]);

  // Refresh current view
  const refreshCurrentView = useCallback(async () => {
    switch (activeView) {
      case 'today':
        await loadTodayTasks();
        break;
      case 'area':
        if (selectedArea) await loadAreaTasks(selectedArea.id);
        break;
      case 'project':
        if (selectedProject) await loadProjectTasks(selectedProject.id);
        break;
      default:
        await loadTasks();
    }
  }, [activeView, selectedArea, selectedProject, loadTasks, loadTodayTasks, loadAreaTasks, loadProjectTasks]);

  // Handle task completion toggle
  const toggleTaskComplete = async (task: TaskWithTags) => {
    try {
      const updateData: UpdateTaskInput = {
        id: task.id,
        is_completed: !task.is_completed
      };
      
      await trpc.updateTask.mutate(updateData);
      await refreshCurrentView();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // Form submission handlers
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createTask.mutate(taskForm);
      setTaskForm({
        title: '',
        notes: null,
        project_id: null,
        area_id: null,
        due_date: null,
        deadline_date: null,
        scheduled_date: null,
        priority: null,
        tag_ids: []
      });
      setIsTaskDialogOpen(false);
      await refreshCurrentView();
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.updateTask.mutate(editTaskForm);
      setIsEditTaskDialogOpen(false);
      await refreshCurrentView();
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      await refreshCurrentView();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createArea.mutate(areaForm);
      setAreaForm({ name: '', color: null });
      setIsAreaDialogOpen(false);
      await loadAreas();
    } catch (error) {
      console.error('Failed to create area:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.updateArea.mutate(editAreaForm);
      setIsEditAreaDialogOpen(false);
      await loadAreas();
      await refreshCurrentView();
    } catch (error) {
      console.error('Failed to update area:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteArea = async (areaId: number) => {
    try {
      await trpc.deleteArea.mutate({ id: areaId });
      if (selectedArea?.id === areaId) {
        setSelectedArea(null);
        setActiveView('today');
      }
      await loadAreas();
      await refreshCurrentView();
    } catch (error) {
      console.error('Failed to delete area:', error);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createProject.mutate(projectForm);
      setProjectForm({ name: '', description: null, area_id: null, color: null });
      setIsProjectDialogOpen(false);
      await loadProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.updateProject.mutate(editProjectForm);
      setIsEditProjectDialogOpen(false);
      await loadProjects();
      await refreshCurrentView();
    } catch (error) {
      console.error('Failed to update project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    try {
      await trpc.deleteProject.mutate({ id: projectId });
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
        setActiveView('today');
      }
      await loadProjects();
      await refreshCurrentView();
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  // Edit handlers
  const openEditTask = (task: TaskWithTags) => {
    setEditTaskForm({
      id: task.id,
      title: task.title,
      notes: task.notes,
      project_id: task.project_id,
      area_id: task.area_id,
      due_date: task.due_date,
      deadline_date: task.deadline_date,
      scheduled_date: task.scheduled_date,
      priority: task.priority,
      tag_ids: task.tags ? task.tags.map((tag: Tag) => tag.id) : []
    });
    setIsEditTaskDialogOpen(true);
  };

  const openEditArea = (area: Area) => {
    setEditAreaForm({
      id: area.id,
      name: area.name,
      color: area.color
    });
    setIsEditAreaDialogOpen(true);
  };

  const openEditProject = (project: Project) => {
    setEditProjectForm({
      id: project.id,
      name: project.name,
      description: project.description,
      area_id: project.area_id,
      color: project.color
    });
    setIsEditProjectDialogOpen(true);
  };

  // View handlers
  const handleViewToday = () => {
    setActiveView('today');
    setSelectedArea(null);
    setSelectedProject(null);
  };

  const handleViewAll = () => {
    setActiveView('all');
    setSelectedArea(null);
    setSelectedProject(null);
    loadTasks();
  };

  const handleViewArea = (area: Area) => {
    setActiveView('area');
    setSelectedArea(area);
    setSelectedProject(null);
    loadAreaTasks(area.id);
  };

  const handleViewProject = (project: Project) => {
    setActiveView('project');
    setSelectedProject(project);
    setSelectedArea(null);
    loadProjectTasks(project.id);
  };

  // Tag toggle handlers
  const toggleCreateTag = (tagId: number) => {
    const currentTagIds = taskForm.tag_ids || [];
    const updatedTagIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter((id: number) => id !== tagId)
      : [...currentTagIds, tagId];
    
    setTaskForm((prev: CreateTaskInput) => ({ ...prev, tag_ids: updatedTagIds }));
  };

  const toggleEditTag = (tagId: number) => {
    const currentTagIds = editTaskForm.tag_ids || [];
    const updatedTagIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter((id: number) => id !== tagId)
      : [...currentTagIds, tagId];
    
    setEditTaskForm((prev: UpdateTaskInput) => ({ ...prev, tag_ids: updatedTagIds }));
  };

  // Get priority icon and color
  const getPriorityDisplay = (priority: string | null) => {
    switch (priority) {
      case 'high':
        return { icon: <AlertCircle className="h-4 w-4 text-red-500" />, color: 'text-red-500' };
      case 'medium':
        return { icon: <Star className="h-4 w-4 text-yellow-500" />, color: 'text-yellow-500' };
      case 'low':
        return { icon: <Circle className="h-4 w-4 text-blue-500" />, color: 'text-blue-500' };
      default:
        return { icon: null, color: '' };
    }
  };

  // Get current tasks based on active view
  const getCurrentTasks = () => {
    switch (activeView) {
      case 'today':
        return todayTasks;
      default:
        return tasks;
    }
  };

  const getCurrentViewTitle = () => {
    switch (activeView) {
      case 'today':
        return '📅 Today';
      case 'area':
        return `📁 ${selectedArea?.name || 'Area'}`;
      case 'project':
        return `📋 ${selectedProject?.name || 'Project'}`;
      default:
        return '📝 All Tasks';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Things 3</h1>
            
            {/* Main Views */}
            <div className="space-y-2 mb-8">
              <Button
                variant={activeView === 'today' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={handleViewToday}
              >
                <CalendarIcon className="h-4 w-4 mr-3" />
                Today
                <Badge variant="secondary" className="ml-auto">
                  {todayTasks.length}
                </Badge>
              </Button>
              
              <Button
                variant={activeView === 'all' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={handleViewAll}
              >
                <List className="h-4 w-4 mr-3" />
                All Tasks
                <Badge variant="secondary" className="ml-auto">
                  {tasks.filter((t: TaskWithTags) => !t.is_completed).length}
                </Badge>
              </Button>
            </div>

            <Separator className="my-6" />

            {/* Areas */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-700">Areas</h3>
                <Dialog open={isAreaDialogOpen} onOpenChange={setIsAreaDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Area</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateArea} className="space-y-4">
                      <Input
                        placeholder="Area name"
                        value={areaForm.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setAreaForm((prev: CreateAreaInput) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                      <Input
                        placeholder="Color (optional)"
                        value={areaForm.color || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setAreaForm((prev: CreateAreaInput) => ({ ...prev, color: e.target.value || null }))
                        }
                      />
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create Area'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              
              <ScrollArea className="h-40">
                <div className="space-y-1">
                  {areas.map((area: Area) => (
                    <div key={area.id} className="flex items-center group">
                      <Button
                        variant={selectedArea?.id === area.id ? 'default' : 'ghost'}
                        className="flex-1 justify-start text-sm"
                        onClick={() => handleViewArea(area)}
                      >
                        <Folder className="h-4 w-4 mr-2" />
                        {area.name}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => openEditArea(area)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteArea(area.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Projects */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-700">Projects</h3>
                <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Project</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateProject} className="space-y-4">
                      <Input
                        placeholder="Project name"
                        value={projectForm.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setProjectForm((prev: CreateProjectInput) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                      <Textarea
                        placeholder="Description (optional)"
                        value={projectForm.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setProjectForm((prev: CreateProjectInput) => ({ ...prev, description: e.target.value || null }))
                        }
                      />
                      <Select
                        value={projectForm.area_id?.toString() || ''}
                        onValueChange={(value: string) =>
                          setProjectForm((prev: CreateProjectInput) => ({ 
                            ...prev, 
                            area_id: value ? parseInt(value) : null 
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select area (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {areas.map((area: Area) => (
                            <SelectItem key={area.id} value={area.id.toString()}>
                              {area.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create Project'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              
              <ScrollArea className="h-40">
                <div className="space-y-1">
                  {projects.map((project: Project) => (
                    <div key={project.id} className="flex items-center group">
                      <Button
                        variant={selectedProject?.id === project.id ? 'default' : 'ghost'}
                        className="flex-1 justify-start text-sm"
                        onClick={() => handleViewProject(project)}
                      >
                        <Circle className="h-4 w-4 mr-2" />
                        {project.name}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => openEditProject(project)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteProject(project.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{getCurrentViewTitle()}</h1>
                <p className="text-gray-600 mt-1">
                  {getCurrentTasks().filter((t: TaskWithTags) => !t.is_completed).length} active tasks
                </p>
              </div>
              
              <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateTask} className="space-y-4">
                    <Input
                      placeholder="Task title"
                      value={taskForm.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTaskForm((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
                      }
                      required
                    />
                    
                    <Textarea
                      placeholder="Notes (optional)"
                      value={taskForm.notes || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setTaskForm((prev: CreateTaskInput) => ({ ...prev, notes: e.target.value || null }))
                      }
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        value={taskForm.area_id?.toString() || ''}
                        onValueChange={(value: string) =>
                          setTaskForm((prev: CreateTaskInput) => ({ 
                            ...prev, 
                            area_id: value ? parseInt(value) : null 
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select area" />
                        </SelectTrigger>
                        <SelectContent>
                          {areas.map((area: Area) => (
                            <SelectItem key={area.id} value={area.id.toString()}>
                              {area.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={taskForm.project_id?.toString() || ''}
                        onValueChange={(value: string) =>
                          setTaskForm((prev: CreateTaskInput) => ({ 
                            ...prev, 
                            project_id: value ? parseInt(value) : null 
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project: Project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Due Date</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              {taskForm.due_date ? taskForm.due_date.toLocaleDateString() : 'Select date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={taskForm.due_date || undefined}
                              onSelect={(date: Date | undefined) =>
                                setTaskForm((prev: CreateTaskInput) => ({ ...prev, due_date: date || null }))
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Deadline</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <AlertCircle className="h-4 w-4 mr-2" />
                              {taskForm.deadline_date ? taskForm.deadline_date.toLocaleDateString() : 'Select date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={taskForm.deadline_date || undefined}
                              onSelect={(date: Date | undefined) =>
                                setTaskForm((prev: CreateTaskInput) => ({ ...prev, deadline_date: date || null }))
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Scheduled</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <Clock className="h-4 w-4 mr-2" />
                              {taskForm.scheduled_date ? taskForm.scheduled_date.toLocaleDateString() : 'Select date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={taskForm.scheduled_date || undefined}
                              onSelect={(date: Date | undefined) =>
                                setTaskForm((prev: CreateTaskInput) => ({ ...prev, scheduled_date: date || null }))
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <Select
                      value={taskForm.priority || ''}
                      onValueChange={(value: string) =>
                        setTaskForm((prev: CreateTaskInput) => ({ 
                          ...prev, 
                          priority: value as 'low' | 'medium' | 'high' | null 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Tags Selection */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
                      <div className="border border-gray-200 rounded-md p-3 max-h-32 overflow-y-auto">
                        {tags.length === 0 ? (
                          <p className="text-sm text-gray-500">No tags available</p>
                        ) : (
                          <div className="space-y-2">
                            {tags.map((tag: Tag) => (
                              <div key={tag.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`tag-${tag.id}`}
                                  checked={(taskForm.tag_ids || []).includes(tag.id)}
                                  onCheckedChange={() => toggleCreateTag(tag.id)}
                                />
                                <label htmlFor={`tag-${tag.id}`} className="text-sm cursor-pointer">
                                  {tag.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {(taskForm.tag_ids || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(taskForm.tag_ids || []).map((tagId: number) => {
                            const tag = tags.find((t: Tag) => t.id === tagId);
                            return tag ? (
                              <Badge key={tagId} variant="secondary" className="text-xs">
                                <TagIcon className="h-3 w-3 mr-1" />
                                {tag.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? 'Creating...' : 'Create Task'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Tasks List */}
            <div className="space-y-3">
              {getCurrentTasks().length === 0 ? (
                <div className="text-center py-12">
                  <Circle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                  <p className="text-gray-600">Create your first task to get started!</p>
                </div>
              ) : (
                getCurrentTasks().map((task: TaskWithTags) => {
                  const priority = getPriorityDisplay(task.priority);
                  const area = areas.find((a: Area) => a.id === task.area_id);
                  const project = projects.find((p: Project) => p.id === task.project_id);
                  
                  return (
                    <Card key={task.id} className={`transition-all hover:shadow-md ${task.is_completed ? 'opacity-60' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          {/* Completion Checkbox */}
                          <Checkbox
                            checked={task.is_completed}
                            onCheckedChange={() => toggleTaskComplete(task)}
                            className="mt-1"
                          />
                          
                          <div className="flex-1 min-w-0">
                            {/* Task Title */}
                            <div className="flex items-center space-x-2 mb-2">
                              {priority.icon}
                              <h3 className={`font-medium ${task.is_completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {task.title}
                              </h3>
                            </div>
                            
                            {/* Task Notes */}
                            {task.notes && (
                              <p className="text-sm text-gray-600 mb-2">{task.notes}</p>
                            )}
                            
                            {/* Task Meta */}
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                              {area && (
                                <Badge variant="outline" className="text-xs">
                                  <Folder className="h-3 w-3 mr-1" />
                                  {area.name}
                                </Badge>
                              )}
                              
                              {project && (
                                <Badge variant="outline" className="text-xs">
                                  <Circle className="h-3 w-3 mr-1" />
                                  {project.name}
                                </Badge>
                              )}
                              
                              {/* Display Task Tags */}
                              {task.tags && task.tags.length > 0 && (
                                task.tags.map((tag: Tag) => (
                                  <Badge 
                                    key={tag.id} 
                                    variant="secondary" 
                                    className="text-xs"
                                    style={{ backgroundColor: tag.color || undefined }}
                                  >
                                    <TagIcon className="h-3 w-3 mr-1" />
                                    {tag.name}
                                  </Badge>
                                ))
                              )}
                              
                              {task.due_date && (
                                <Badge variant="outline" className="text-xs">
                                  <CalendarIcon className="h-3 w-3 mr-1" />
                                  Due: {task.due_date.toLocaleDateString()}
                                </Badge>
                              )}
                              
                              {task.deadline_date && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Deadline: {task.deadline_date.toLocaleDateString()}
                                </Badge>
                              )}
                              
                              {task.scheduled_date && (
                                <Badge variant="secondary" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Scheduled: {task.scheduled_date.toLocaleDateString()}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Task Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => openEditTask(task)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={isEditTaskDialogOpen} onOpenChange={setIsEditTaskDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateTask} className="space-y-4">
            <Input
              placeholder="Task title"
              value={editTaskForm.title || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEditTaskForm((prev: UpdateTaskInput) => ({ ...prev, title: e.target.value }))
              }
              required
            />
            
            <Textarea
              placeholder="Notes (optional)"
              value={editTaskForm.notes || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setEditTaskForm((prev: UpdateTaskInput) => ({ ...prev, notes: e.target.value || null }))
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                value={editTaskForm.area_id?.toString() || ''}
                onValueChange={(value: string) =>
                  setEditTaskForm((prev: UpdateTaskInput) => ({ 
                    ...prev, 
                    area_id: value ? parseInt(value) : null 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area: Area) => (
                    <SelectItem key={area.id} value={area.id.toString()}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={editTaskForm.project_id?.toString() || ''}
                onValueChange={(value: string) =>
                  setEditTaskForm((prev: UpdateTaskInput) => ({ 
                    ...prev, 
                    project_id: value ? parseInt(value) : null 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project: Project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Due Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {editTaskForm.due_date ? editTaskForm.due_date.toLocaleDateString() : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editTaskForm.due_date || undefined}
                      onSelect={(date: Date | undefined) =>
                        setEditTaskForm((prev: UpdateTaskInput) => ({ ...prev, due_date: date || null }))
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Deadline</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {editTaskForm.deadline_date ? editTaskForm.deadline_date.toLocaleDateString() : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editTaskForm.deadline_date || undefined}
                      onSelect={(date: Date | undefined) =>
                        setEditTaskForm((prev: UpdateTaskInput) => ({ ...prev, deadline_date: date || null }))
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Scheduled</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Clock className="h-4 w-4 mr-2" />
                      {editTaskForm.scheduled_date ? editTaskForm.scheduled_date.toLocaleDateString() : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editTaskForm.scheduled_date || undefined}
                      onSelect={(date: Date | undefined) =>
                        setEditTaskForm((prev: UpdateTaskInput) => ({ ...prev, scheduled_date: date || null }))
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Select
              value={editTaskForm.priority || ''}
              onValueChange={(value: string) =>
                setEditTaskForm((prev: UpdateTaskInput) => ({ 
                  ...prev, 
                  priority: value as 'low' | 'medium' | 'high' | null 
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>

            {/* Tags Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
              <div className="border border-gray-200 rounded-md p-3 max-h-32 overflow-y-auto">
                {tags.length === 0 ? (
                  <p className="text-sm text-gray-500">No tags available</p>
                ) : (
                  <div className="space-y-2">
                    {tags.map((tag: Tag) => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-tag-${tag.id}`}
                          checked={(editTaskForm.tag_ids || []).includes(tag.id)}
                          onCheckedChange={() => toggleEditTag(tag.id)}
                        />
                        <label htmlFor={`edit-tag-${tag.id}`} className="text-sm cursor-pointer">
                          {tag.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {(editTaskForm.tag_ids || []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(editTaskForm.tag_ids || []).map((tagId: number) => {
                    const tag = tags.find((t: Tag) => t.id === tagId);
                    return tag ? (
                      <Badge key={tagId} variant="secondary" className="text-xs">
                        <TagIcon className="h-3 w-3 mr-1" />
                        {tag.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Updating...' : 'Update Task'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Area Dialog */}
      <Dialog open={isEditAreaDialogOpen} onOpenChange={setIsEditAreaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Area</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateArea} className="space-y-4">
            <Input
              placeholder="Area name"
              value={editAreaForm.name || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEditAreaForm((prev: UpdateAreaInput) => ({ ...prev, name: e.target.value }))
              }
              required
            />
            <Input
              placeholder="Color (optional)"
              value={editAreaForm.color || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEditAreaForm((prev: UpdateAreaInput) => ({ ...prev, color: e.target.value || null }))
              }
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Area'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditProjectDialogOpen} onOpenChange={setIsEditProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProject} className="space-y-4">
            <Input
              placeholder="Project name"
              value={editProjectForm.name || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEditProjectForm((prev: UpdateProjectInput) => ({ ...prev, name: e.target.value }))
              }
              required
            />
            <Textarea
              placeholder="Description (optional)"
              value={editProjectForm.description || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setEditProjectForm((prev: UpdateProjectInput) => ({ ...prev, description: e.target.value || null }))
              }
            />
            <Select
              value={editProjectForm.area_id?.toString() || ''}
              onValueChange={(value: string) =>
                setEditProjectForm((prev: UpdateProjectInput) => ({ 
                  ...prev, 
                  area_id: value ? parseInt(value) : null 
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select area (optional)" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area: Area) => (
                  <SelectItem key={area.id} value={area.id.toString()}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Project'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
