import type { PlanStage, PlanTemplate } from './content';
export type PlanMode = 'staged' | 'steady' | 'custom';
export function createStages(mode: PlanMode): PlanStage[] {
  return Array.from({ length: mode === 'staged' ? 3 : 1 }, (_, i) => ({ id: i + 1, amount: '', weeks: mode === 'custom' ? 1 : 4 }));
}
export function copyReferencePlan(template: PlanTemplate, compoundId: string) {
  if (template.compoundId !== compoundId || template.status !== 'reviewed') throw new Error('Only a reviewed plan for this compound can be copied.');
  if (!template.stages.length || !Number.isInteger(template.breakWeeks) || template.breakWeeks < 0 || template.breakWeeks > 52 || template.stages.some(s => !Number.isInteger(s.weeks) || s.weeks < 1 || s.weeks > 52 || (s.amount !== '' && (!Number.isFinite(Number(s.amount)) || Number(s.amount) < 0)))) throw new Error('Invalid reference plan.');
  return {
    compoundId, stages: template.stages.map((s, i) => ({ ...s, id: i + 1, cadence: s.cadence ? { ...s.cadence } : undefined })),
    breakWeeks: template.breakWeeks,
    origin: {
      templateId: template.id, templateTitle: template.title, sourceType: template.sourceType,
      sourceClass: template.sourceClass, sourceTitle: template.sourceTitle,
      sourceIds: [...template.sourceIds], sources: template.sources.map(source => ({ ...source })),
      originalStages: template.originalStages.map(stage => ({ ...stage })),
      suppliedPlan: JSON.parse(JSON.stringify(template.suppliedPlan)) as PlanTemplate['suppliedPlan'],
      citationIds: [...template.citationIds], contentVersion: template.contentVersion,
    },
  };
}
export function calculate(vialText: string, waterText: string, amountMgText: string) {
  if ([vialText, waterText, amountMgText].some(s => !s.trim())) return null;
  const [vial, water, amount] = [vialText, waterText, amountMgText].map(Number);
  if (![vial, water, amount].every(Number.isFinite) || vial <= 0 || water <= 0 || amount <= 0) return null;
  const concentration = vial / water, volume = amount / concentration, units = volume * 100;
  if (![concentration, volume, units].every(Number.isFinite) || concentration <= 0) return null;
  return { concentration, volume, units, exceedsSyringe: units > 100 };
}
/** Preview weeks start at 1. Remaining time includes the current preview week. */
export function planProgress(stages: PlanStage[], breakWeeks: number, previewWeek: number) {
  const totalWeeks = stages.reduce((n, s) => n + s.weeks, 0);
  const week = Math.max(1, Math.min(totalWeeks + breakWeeks + 1, Math.floor(previewWeek)));
  let before = 0;
  const stageIndex = stages.findIndex(s => { if (week <= before + s.weeks) return true; before += s.weeks; return false; });
  const inBreak = week > totalWeeks && week <= totalWeeks + breakWeeks;
  const complete = week > totalWeeks + breakWeeks;
  const stageWeek = stageIndex >= 0 ? week - before : 0;
  const weeksToTransition = stageIndex >= 0 ? stages[stageIndex].weeks - stageWeek + 1 : 0;
  return { totalWeeks, week, stageIndex, stageWeek, inBreak, complete, weeksToTransition,
    breakWeek: inBreak ? week - totalWeeks : 0,
    weeksRemaining: Math.max(0, totalWeeks - week + 1),
    pct: totalWeeks ? Math.min(100, Math.round(((week - 1) / totalWeeks) * 100)) : 0,
    nextStage: stageIndex >= 0 ? stages[stageIndex + 1] : undefined,
  };
}
