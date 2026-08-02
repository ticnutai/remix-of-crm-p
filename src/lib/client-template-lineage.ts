export interface TemplateStageSelection {
  templateId: string;
  stageId: string;
  stageName: string;
}

export interface ClientWorkflowStage {
  stage_id: string;
  stage_name: string;
}

export interface TemplateTaskSelection {
  templateId: string;
  stageId: string;
}

function matchesTemplateStage(
  stage: ClientWorkflowStage,
  selection: TemplateStageSelection | TemplateTaskSelection,
): boolean {
  return (
    stage.stage_id === `template_${selection.templateId}_${selection.stageId}` ||
    stage.stage_id.startsWith(
      `template_${selection.templateId}_${selection.stageId}_`,
    ) ||
    ("stageName" in selection && stage.stage_name === selection.stageName)
  );
}

export function workflowContainsSelectedTemplateStage(
  stages: ClientWorkflowStage[],
  selections: TemplateStageSelection[],
): boolean {
  return selections.some((selection) =>
    stages.some(
      (stage) =>
        stage.stage_name === selection.stageName ||
        stage.stage_id === `template_${selection.templateId}_${selection.stageId}` ||
        stage.stage_id.startsWith(`template_${selection.templateId}_${selection.stageId}_`),
    ),
  );
}

export function getSelectedWorkflowStageIds(
  stages: ClientWorkflowStage[],
  stageSelections: TemplateStageSelection[],
  taskSelections: TemplateTaskSelection[],
): Set<string> {
  const activeSelections =
    taskSelections.length > 0 ? taskSelections : stageSelections;

  return new Set(
    stages
      .filter((stage) =>
        activeSelections.some((selection) =>
          matchesTemplateStage(stage, selection),
        ),
      )
      .map((stage) => stage.stage_id),
  );
}

export function countLinkedClientsByTemplate(
  assignments: Array<{ client_id: string; template_id: string }>,
): Map<string, number> {
  const linkedClients = new Map<string, Set<string>>();

  assignments.forEach(({ client_id, template_id }) => {
    const clients = linkedClients.get(template_id) || new Set<string>();
    clients.add(client_id);
    linkedClients.set(template_id, clients);
  });

  return new Map(
    Array.from(linkedClients.entries(), ([templateId, clients]) => [templateId, clients.size]),
  );
}
