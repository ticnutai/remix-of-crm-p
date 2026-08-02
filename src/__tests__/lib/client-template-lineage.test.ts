import { describe, expect, it } from "vitest";
import {
  countLinkedClientsByTemplate,
  getSelectedWorkflowStageIds,
  workflowContainsSelectedTemplateStage,
} from "@/lib/client-template-lineage";

describe("client template lineage", () => {
  const printSelection = {
    templateId: "local-plan",
    stageId: "print",
    stageName: "הדפסה",
  };

  it("matches a pinned stage anywhere in the workflow, not only the current stage", () => {
    const stages = [
      { stage_id: "template_local-plan_contact", stage_name: "התקשרות לקוח" },
      { stage_id: "template_local-plan_print", stage_name: "הדפסה" },
    ];
    expect(workflowContainsSelectedTemplateStage(stages, [printSelection])).toBe(true);
  });

  it("matches migrated stage ids that have a deterministic suffix", () => {
    const stages = [
      { stage_id: "template_local-plan_print_legacy-client", stage_name: "שם ישן" },
    ];
    expect(workflowContainsSelectedTemplateStage(stages, [printSelection])).toBe(true);
  });

  it("does not match when the selected stage is absent", () => {
    const stages = [
      { stage_id: "template_local-plan_contact", stage_name: "התקשרות לקוח" },
    ];
    expect(workflowContainsSelectedTemplateStage(stages, [printSelection])).toBe(false);
  });

  it("renders the selected future stage instead of the current stage", () => {
    const stages = [
      { stage_id: "template_local-plan_contact", stage_name: "התקשרות לקוח" },
      { stage_id: "template_local-plan_print", stage_name: "הדפסה" },
    ];

    expect(
      Array.from(getSelectedWorkflowStageIds(stages, [printSelection], [])),
    ).toEqual(["template_local-plan_print"]);
  });

  it("gives a selected task precedence over a broader stage selection", () => {
    const stages = [
      { stage_id: "template_local-plan_contact", stage_name: "התקשרות לקוח" },
      { stage_id: "template_local-plan_print", stage_name: "הדפסה" },
    ];

    expect(
      Array.from(
        getSelectedWorkflowStageIds(
          stages,
          [{ ...printSelection, stageId: "contact", stageName: "התקשרות לקוח" }],
          [{ templateId: "local-plan", stageId: "print" }],
        ),
      ),
    ).toEqual(["template_local-plan_print"]);
  });

  it("counts unique linked clients per template", () => {
    const counts = countLinkedClientsByTemplate([
      { client_id: "client-1", template_id: "template-a" },
      { client_id: "client-1", template_id: "template-a" },
      { client_id: "client-2", template_id: "template-a" },
      { client_id: "client-3", template_id: "template-b" },
    ]);
    expect(counts.get("template-a")).toBe(2);
    expect(counts.get("template-b")).toBe(1);
  });
});
