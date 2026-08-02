export interface TemplateStageSelection {
  templateId: string;
  stageId: string;
  stageName: string;
}

export interface ClientWorkflowStage {
  stage_id: string;
  stage_name: string;
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
