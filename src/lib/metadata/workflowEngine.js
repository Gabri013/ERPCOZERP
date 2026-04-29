export function getWorkflowStep(workflow, stepKey) {
  return workflow?.steps?.find((step) => step.key === stepKey) || null;
}

export function canTransition(workflow, fromKey, toKey, userRole) {
  const fromStep = getWorkflowStep(workflow, fromKey);
  const toStep = getWorkflowStep(workflow, toKey);
  if (!fromStep || !toStep) return false;
  if (!workflow.active) return false;
  if (fromStep.key === toStep.key) return true;
  return toStep.approverRoles?.includes(userRole) || fromStep.approverRoles?.includes(userRole);
}

export function getWorkflowProgress(workflow, currentStepKey) {
  const total = workflow?.steps?.length || 0;
  const index = workflow?.steps?.findIndex((step) => step.key === currentStepKey) ?? -1;
  return total > 0 && index >= 0 ? Math.round(((index + 1) / total) * 100) : 0;
}
