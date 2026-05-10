// Tipos para workflow
interface WorkflowStep {
  key: string;
  approverRoles?: string[];
}

interface Workflow {
  steps?: WorkflowStep[];
  active: boolean;
}

export function getWorkflowStep(workflow: Workflow | null | undefined, stepKey: string): WorkflowStep | null {
  return workflow?.steps?.find((step) => step.key === stepKey) || null;
}

export function canTransition(workflow: Workflow | null | undefined, fromKey: string, toKey: string, userRole: string): boolean {
  const fromStep = getWorkflowStep(workflow, fromKey);
  const toStep = getWorkflowStep(workflow, toKey);
  if (!fromStep || !toStep) return false;
  if (!workflow?.active) return false;
  if (fromStep.key === toStep.key) return true;
  return toStep.approverRoles?.includes(userRole) || fromStep.approverRoles?.includes(userRole) || false;
}

export function getWorkflowProgress(workflow: Workflow | null | undefined, currentStepKey: string): number {
  const total = workflow?.steps?.length || 0;
  const index = workflow?.steps?.findIndex((step) => step.key === currentStepKey) ?? -1;
  return total > 0 && index >= 0 ? Math.round(((index + 1) / total) * 100) : 0;
}
