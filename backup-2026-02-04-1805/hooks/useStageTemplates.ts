import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Helper to access tables not yet in generated types
// Remove after running migration and regenerating types
const db = supabase as any;

// Types
export interface TemplateTask {
  id: string;
  template_id: string;
  template_stage_id: string | null;
  title: string;
  sort_order: number;
  // Content fields (saved when includeTaskContent is true)
  completed?: boolean;
  completed_at?: string | null;
  background_color?: string | null;
  text_color?: string | null;
  is_bold?: boolean;
  target_working_days?: number | null;
  started_at?: string | null;
}

export interface TemplateStage {
  id: string;
  template_id: string;
  stage_name: string;
  stage_icon: string;
  sort_order: number;
  tasks?: TemplateTask[];
}

export interface StageTemplate {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  is_multi_stage: boolean;
  includes_task_content: boolean; // Whether template has saved task content
  created_by: string | null;
  created_at: string;
  updated_at: string;
  stages?: TemplateStage[];
  tasks?: TemplateTask[]; // For single-stage templates
}

export interface ClientStage {
  id: string;
  client_id: string;
  stage_id: string;
  stage_name: string;
  stage_icon: string | null;
  sort_order: number;
  tasks?: { id: string; title: string; completed: boolean; sort_order: number }[];
}

export function useStageTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<StageTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all templates
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch templates
      const { data: templatesData, error: templatesError } = await db
        .from('stage_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;

      // Fetch all template stages
      const { data: stagesData, error: stagesError } = await db
        .from('stage_template_stages')
        .select('*')
        .order('sort_order', { ascending: true });

      if (stagesError) throw stagesError;

      // Fetch all template tasks
      const { data: tasksData, error: tasksError } = await db
        .from('stage_template_tasks')
        .select('*')
        .order('sort_order', { ascending: true });

      if (tasksError) throw tasksError;

      // Combine data
      const templatesWithData = (templatesData || []).map(template => {
        const templateStages = (stagesData || [])
          .filter(s => s.template_id === template.id)
          .map(stage => ({
            ...stage,
            tasks: (tasksData || []).filter(t => t.template_stage_id === stage.id),
          }));

        const templateTasks = (tasksData || []).filter(
          t => t.template_id === template.id && !t.template_stage_id
        );

        // Debug log
        console.log(`Template "${template.name}": ${templateStages.length} stages, tasks per stage:`, 
          templateStages.map(s => `${s.stage_name}: ${s.tasks?.length || 0}`));

        return {
          ...template,
          stages: templateStages,
          tasks: templateTasks,
        };
      });

      setTemplates(templatesWithData);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'שגיאה בטעינת תבניות',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Save a single stage as template
  const saveStageAsTemplate = useCallback(async (
    stage: ClientStage,
    templateName: string,
    description?: string
  ) => {
    if (!user) return null;

    try {
      // Create template
      const { data: template, error: templateError } = await db
        .from('stage_templates')
        .insert({
          name: templateName,
          description,
          icon: stage.stage_icon || 'FolderOpen',
          is_multi_stage: false,
          created_by: user.id,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Create template stage
      const { data: templateStage, error: stageError } = await db
        .from('stage_template_stages')
        .insert({
          template_id: template.id,
          stage_name: stage.stage_name,
          stage_icon: stage.stage_icon || 'FolderOpen',
          sort_order: 0,
        })
        .select()
        .single();

      if (stageError) throw stageError;

      // Create template tasks
      if (stage.tasks && stage.tasks.length > 0) {
        const templateTasks = stage.tasks.map((task, index) => ({
          template_id: template.id,
          template_stage_id: templateStage.id,
          title: task.title,
          sort_order: task.sort_order ?? index,
        }));

        const { error: tasksError } = await db
          .from('stage_template_tasks')
          .insert(templateTasks);

        if (tasksError) throw tasksError;
      }

      toast({
        title: 'התבנית נשמרה בהצלחה',
        description: `"${templateName}" עם ${stage.tasks?.length || 0} משימות`,
      });

      await loadTemplates();
      return template;
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'שגיאה בשמירת התבנית',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast, loadTemplates]);

  // Save multiple stages as a multi-stage template
  // includeTaskContent: if true, saves task completion status, colors, styling etc.
  const saveMultiStageTemplate = useCallback(async (
    stages: ClientStage[],
    templateName: string,
    description?: string,
    includeTaskContent: boolean = false
  ) => {
    if (!user) return null;

    try {
      // Create template
      const { data: template, error: templateError } = await db
        .from('stage_templates')
        .insert({
          name: templateName,
          description,
          icon: 'Layers',
          is_multi_stage: true,
          created_by: user.id,
          includes_task_content: includeTaskContent,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Create all template stages
      for (const stage of stages) {
        const { data: templateStage, error: stageError } = await db
          .from('stage_template_stages')
          .insert({
            template_id: template.id,
            stage_name: stage.stage_name,
            stage_icon: stage.stage_icon || 'FolderOpen',
            sort_order: stage.sort_order,
          })
          .select()
          .single();

        if (stageError) throw stageError;

        // Create tasks for this stage
        if (stage.tasks && stage.tasks.length > 0) {
          const templateTasks = stage.tasks.map((task: any, index) => {
            const baseTask = {
              template_id: template.id,
              template_stage_id: templateStage.id,
              title: task.title,
              sort_order: task.sort_order ?? index,
            };

            // If including task content, add completion status and styling
            if (includeTaskContent) {
              return {
                ...baseTask,
                completed: task.completed || false,
                completed_at: task.completed_at || null,
                background_color: task.background_color || null,
                text_color: task.text_color || null,
                is_bold: task.is_bold || false,
                target_working_days: task.target_working_days || null,
                started_at: task.started_at || null,
              };
            }

            return baseTask;
          });

          const { error: tasksError } = await db
            .from('stage_template_tasks')
            .insert(templateTasks);

          if (tasksError) throw tasksError;
        }
      }

      const totalTasks = stages.reduce((sum, s) => sum + (s.tasks?.length || 0), 0);
      const contentNote = includeTaskContent ? ' (כולל מילוי)' : '';
      toast({
        title: 'התבנית נשמרה בהצלחה',
        description: `"${templateName}" עם ${stages.length} שלבים ו-${totalTasks} משימות${contentNote}`,
      });

      await loadTemplates();
      return template;
    } catch (error) {
      console.error('Error saving multi-stage template:', error);
      toast({
        title: 'שגיאה בשמירת התבנית',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast, loadTemplates]);

  // Apply template to a client - creates stages and tasks
  // If template includes_task_content, the task completion status and styling will be preserved
  const applyTemplate = useCallback(async (
    templateId: string,
    clientId: string,
    existingStagesCount: number = 0
  ) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const createdStages: string[] = [];
      const includesContent = template.includes_task_content;

      if (template.stages && template.stages.length > 0) {
        for (const templateStage of template.stages) {
          const stageId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // Create stage
          const { error: stageError } = await supabase
            .from('client_stages')
            .insert({
              client_id: clientId,
              stage_id: stageId,
              stage_name: templateStage.stage_name,
              stage_icon: templateStage.stage_icon,
              sort_order: existingStagesCount + templateStage.sort_order,
            });

          if (stageError) throw stageError;
          createdStages.push(stageId);

          // Create tasks for this stage
          if (templateStage.tasks && templateStage.tasks.length > 0) {
            const tasks = templateStage.tasks.map(task => {
              const baseTask: any = {
                client_id: clientId,
                stage_id: stageId,
                title: task.title,
                sort_order: task.sort_order,
                completed: false,
              };

              // If template includes content, apply saved task state
              if (includesContent) {
                return {
                  ...baseTask,
                  completed: task.completed || false,
                  completed_at: task.completed_at || null,
                  background_color: task.background_color || null,
                  text_color: task.text_color || null,
                  is_bold: task.is_bold || false,
                  target_working_days: task.target_working_days || null,
                  started_at: task.started_at || null,
                };
              }

              return baseTask;
            });

            const { error: tasksError } = await supabase
              .from('client_stage_tasks')
              .insert(tasks);

            if (tasksError) throw tasksError;
          }
        }
      }

      const contentNote = includesContent ? ' (כולל מילוי)' : '';
      toast({
        title: 'התבנית הוחלה בהצלחה',
        description: `נוספו ${createdStages.length} שלבים${contentNote}`,
      });

      return createdStages;
    } catch (error) {
      console.error('Error applying template:', error);
      toast({
        title: 'שגיאה בהחלת התבנית',
        variant: 'destructive',
      });
      return null;
    }
  }, [templates, toast]);

  // Copy stages from another client
  const copyStagesFromClient = useCallback(async (
    sourceClientId: string,
    targetClientId: string,
    stageIds?: string[] // If empty, copy all stages
  ) => {
    try {
      // Fetch source stages
      const { data: sourceStages, error: stagesError } = await supabase
        .from('client_stages')
        .select('*')
        .eq('client_id', sourceClientId)
        .order('sort_order', { ascending: true });

      if (stagesError) throw stagesError;

      // Fetch source tasks
      const { data: sourceTasks, error: tasksError } = await supabase
        .from('client_stage_tasks')
        .select('*')
        .eq('client_id', sourceClientId)
        .order('sort_order', { ascending: true });

      if (tasksError) throw tasksError;

      // Filter stages if specific ones are requested
      const stagesToCopy = stageIds && stageIds.length > 0
        ? sourceStages?.filter(s => stageIds.includes(s.stage_id))
        : sourceStages;

      if (!stagesToCopy || stagesToCopy.length === 0) {
        toast({
          title: 'אין שלבים להעתקה',
          variant: 'destructive',
        });
        return null;
      }

      // Get existing stages count for sort_order
      const { data: existingStages } = await supabase
        .from('client_stages')
        .select('sort_order')
        .eq('client_id', targetClientId)
        .order('sort_order', { ascending: false })
        .limit(1);

      const maxSortOrder = existingStages?.[0]?.sort_order ?? -1;

      // Create new stages
      const stageIdMap = new Map<string, string>(); // old_stage_id -> new_stage_id

      for (let i = 0; i < stagesToCopy.length; i++) {
        const stage = stagesToCopy[i];
        const newStageId = `copied_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        stageIdMap.set(stage.stage_id, newStageId);

        const { error: insertError } = await supabase
          .from('client_stages')
          .insert({
            client_id: targetClientId,
            stage_id: newStageId,
            stage_name: stage.stage_name,
            stage_icon: stage.stage_icon,
            sort_order: maxSortOrder + 1 + i,
          });

        if (insertError) throw insertError;
      }

      // Copy tasks
      const stageIdsToInclude = Array.from(stageIdMap.keys());
      const tasksToInsert = sourceTasks
        ?.filter(t => stageIdsToInclude.includes(t.stage_id))
        .map(task => ({
          client_id: targetClientId,
          stage_id: stageIdMap.get(task.stage_id)!,
          title: task.title,
          sort_order: task.sort_order,
          completed: false, // Reset completion status
        }));

      if (tasksToInsert && tasksToInsert.length > 0) {
        const { error: tasksInsertError } = await supabase
          .from('client_stage_tasks')
          .insert(tasksToInsert);

        if (tasksInsertError) throw tasksInsertError;
      }

      toast({
        title: 'השלבים הועתקו בהצלחה',
        description: `הועתקו ${stagesToCopy.length} שלבים ו-${tasksToInsert?.length || 0} משימות`,
      });

      return Array.from(stageIdMap.values());
    } catch (error) {
      console.error('Error copying stages:', error);
      toast({
        title: 'שגיאה בהעתקת השלבים',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  // Update template
  const updateTemplate = useCallback(async (
    templateId: string,
    updates: Partial<Pick<StageTemplate, 'name' | 'description' | 'icon' | 'color'>>
  ) => {
    try {
      const { error } = await db
        .from('stage_templates')
        .update(updates)
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: 'התבנית עודכנה בהצלחה',
      });

      await loadTemplates();
      return true;
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: 'שגיאה בעדכון התבנית',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, loadTemplates]);

  // Delete template
  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      const { error } = await db
        .from('stage_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: 'התבנית נמחקה',
      });

      await loadTemplates();
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'שגיאה במחיקת התבנית',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, loadTemplates]);

  // Get clients list for copy feature
  const getClientsForCopy = useCallback(async (excludeClientId?: string) => {
    try {
      let query = supabase
        .from('clients')
        .select('id, name')
        .order('name', { ascending: true });

      if (excludeClientId) {
        query = query.neq('id', excludeClientId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
  }, []);

  // Get stages for a specific client (for copy preview)
  const getClientStages = useCallback(async (clientId: string) => {
    try {
      const { data: stages, error: stagesError } = await supabase
        .from('client_stages')
        .select('*')
        .eq('client_id', clientId)
        .order('sort_order', { ascending: true });

      if (stagesError) throw stagesError;

      const { data: tasks, error: tasksError } = await supabase
        .from('client_stage_tasks')
        .select('*')
        .eq('client_id', clientId)
        .order('sort_order', { ascending: true });

      if (tasksError) throw tasksError;

      return (stages || []).map(stage => ({
        ...stage,
        tasks: (tasks || []).filter(t => t.stage_id === stage.stage_id),
      }));
    } catch (error) {
      console.error('Error fetching client stages:', error);
      return [];
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    templates,
    loading,
    loadTemplates,
    saveStageAsTemplate,
    saveMultiStageTemplate,
    applyTemplate,
    copyStagesFromClient,
    updateTemplate,
    deleteTemplate,
    getClientsForCopy,
    getClientStages,
  };
}
