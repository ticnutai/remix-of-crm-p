import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const email = process.env.CRM_TEST_EMAIL;
const password = process.env.CRM_TEST_PASSWORD;

if (!url || !anonKey || !email || !password) {
  throw new Error("Missing VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, CRM_TEST_EMAIL or CRM_TEST_PASSWORD");
}

const supabase = createClient(url, anonKey);
const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
if (authError) throw authError;

const { data: templateTasks, error: tasksError } = await supabase
  .from("stage_template_tasks")
  .select("id, template_id, template_stage_id, title, sort_order")
  .order("sort_order");
if (tasksError) throw tasksError;

const paymentTasks = (templateTasks || []).filter((task) =>
  String(task.title || "").includes("תשלום") && task.template_stage_id,
);
if (!paymentTasks.length) throw new Error("No stage-template task containing תשלום was found");

const grouped = new Map();
for (const task of paymentTasks) {
  const items = grouped.get(task.template_id) || [];
  items.push(task);
  grouped.set(task.template_id, items);
}
const [stageTemplateId, selectedTasks] = [...grouped.entries()].sort((a, b) => b[1].length - a[1].length)[0];
const chosenTasks = selectedTasks.slice(0, 4);

const { data: templateStages, error: stagesError } = await supabase
  .from("stage_template_stages")
  .select("id, stage_name")
  .eq("template_id", stageTemplateId);
if (stagesError) throw stagesError;
const stageById = new Map((templateStages || []).map((stage) => [stage.id, stage]));

const paymentSchedule = chosenTasks.map((task, index) => {
  const percentage = index === chosenTasks.length - 1
    ? 100 - Math.floor(100 / chosenTasks.length) * (chosenTasks.length - 1)
    : Math.floor(100 / chosenTasks.length);
  return {
    id: `atomic-e2e-${index + 1}`,
    percentage,
    description: task.title,
    vatRate: 18,
    useCustomVat: false,
    linkSource: "stage_template",
    templateStageId: task.template_stage_id,
    templateStageName: stageById.get(task.template_stage_id)?.stage_name || null,
    templateTaskId: task.id,
    templateTaskName: task.title,
  };
});

const idempotencyKey = randomUUID();
const clientName = `בדיקת אטומיות תשלומים Codex ${new Date().toISOString()}`;
const request = {
  idempotency_key: idempotencyKey,
  existing_client_id: null,
  client: { name: clientName, notes: "בדיקת E2E אוטומטית של שיוך תשלומים למשימות" },
  quote: {
    title: "בדיקת הצעה אטומית",
    description: "בדיקת E2E",
    base_price: 35000,
    vat_rate: 18,
    template_data: {},
    project_details: { clientName, stageTemplateId },
  },
  stage_template_id: stageTemplateId,
  payment_schedule: paymentSchedule,
};

const { data: firstResult, error: firstError } = await supabase.rpc(
  "create_client_file_from_quote",
  { p_request: request },
);
if (firstError) throw firstError;

const { data: replayResult, error: replayError } = await supabase.rpc(
  "create_client_file_from_quote",
  { p_request: request },
);
if (replayError) throw replayError;

const [{ data: payments, error: paymentsError }, { data: linkedTasks, error: linkedTasksError }, { data: contracts, error: contractsError }] = await Promise.all([
  supabase
    .from("client_payment_stages")
    .select("id, quote_id, payment_step_id, percentage, linked_stage_id, linked_task_id, amount, amount_with_vat")
    .eq("quote_id", firstResult.saved_quote_id)
    .order("stage_number"),
  supabase
    .from("client_stage_tasks")
    .select("id, title, payment_amount, payment_percentage, payment_quote_id, payment_step_id")
    .eq("client_id", firstResult.client_id)
    .eq("payment_quote_id", firstResult.saved_quote_id),
  supabase
    .from("contracts")
    .select("id, saved_quote_id, client_id, contract_value")
    .eq("id", firstResult.contract_id),
]);
if (paymentsError) throw paymentsError;
if (linkedTasksError) throw linkedTasksError;
if (contractsError) throw contractsError;

const failures = [];
if (firstResult.payments_added !== paymentSchedule.length) failures.push("payment count mismatch");
if (firstResult.payments_linked !== paymentSchedule.length) failures.push("not every payment linked to a task");
if ((payments || []).some((row) => !row.linked_task_id || !row.linked_stage_id)) failures.push("missing explicit payment linkage");
if ((linkedTasks || []).length !== paymentSchedule.length) failures.push("linked task count mismatch");
if ((payments || []).some((row) => {
  const task = (linkedTasks || []).find((candidate) => candidate.id === row.linked_task_id);
  return !task || Number(task.payment_amount) !== Number(row.amount_with_vat);
})) failures.push("task amount differs from payment gross amount");
if (contracts?.[0]?.saved_quote_id !== firstResult.saved_quote_id) failures.push("contract is not linked to saved quote");
if (!replayResult.idempotent_replay || replayResult.client_id !== firstResult.client_id) failures.push("idempotent replay failed");
if (failures.length) throw new Error(failures.join("; "));

console.log(JSON.stringify({
  ok: true,
  clientName,
  clientId: firstResult.client_id,
  savedQuoteId: firstResult.saved_quote_id,
  contractId: firstResult.contract_id,
  stageTemplateId,
  stagesAdded: firstResult.stages_added,
  tasksAdded: firstResult.tasks_added,
  paymentsAdded: payments.length,
  paymentsLinked: linkedTasks.length,
  idempotentReplay: replayResult.idempotent_replay,
  amounts: payments.map((row) => ({ net: row.amount, gross: row.amount_with_vat, percentage: row.percentage })),
}, null, 2));
