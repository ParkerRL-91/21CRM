import { Injectable, Logger } from '@nestjs/common';

import { Decimal } from 'src/modules/cpq/utils/cpq-decimal.utils';

// Approval engine — evaluates quote values against configurable rules,
// creates approval request chains, and supports smart re-approval
// (skip unchanged steps on resubmit).
@Injectable()
export class CpqApprovalService {
  private readonly logger = new Logger(CpqApprovalService.name);

  // Evaluate all active rules against a quote's values.
  // Returns the list of triggered rules (approval path).
  evaluateRules(
    quoteValues: QuoteApprovalValues,
    rules: ApprovalRuleDefinition[],
  ): ApprovalPathResult {
    const activeRules = rules
      .filter((rule) => rule.isActive)
      .sort((ruleA, ruleB) => ruleA.stepNumber - ruleB.stepNumber);

    const triggeredRules: TriggeredRule[] = [];

    for (const rule of activeRules) {
      const triggered = this.evaluateConditions(quoteValues, rule.conditions);
      if (triggered) {
        triggeredRules.push({
          ruleId: rule.id,
          ruleName: rule.name,
          stepNumber: rule.stepNumber,
          approverRole: rule.approverRole,
          reason: this.describeConditions(rule.conditions, quoteValues),
        });
      }
    }

    return {
      requiresApproval: triggeredRules.length > 0,
      steps: triggeredRules,
      totalSteps: triggeredRules.length,
    };
  }

  // Check if a resubmitted quote can skip previously-approved steps.
  // Steps where the relevant quote values haven't changed are auto-skipped.
  smartReapproval(
    currentValues: QuoteApprovalValues,
    previousValues: QuoteApprovalValues,
    previousApprovals: PreviousApproval[],
    rules: ApprovalRuleDefinition[],
  ): SmartReapprovalResult {
    const currentPath = this.evaluateRules(currentValues, rules);
    const skippedSteps: number[] = [];
    const requiredSteps: number[] = [];

    for (const step of currentPath.steps) {
      const previousApproval = previousApprovals.find(
        (approval) => approval.stepNumber === step.stepNumber && approval.status === 'approved',
      );

      if (!previousApproval) {
        requiredSteps.push(step.stepNumber);
        continue;
      }

      // Check if the conditions that triggered this step have changed
      const rule = rules.find((ruleCandidate) => ruleCandidate.id === step.ruleId);
      if (!rule) {
        requiredSteps.push(step.stepNumber);
        continue;
      }

      const conditionsChanged = this.haveConditionsChanged(
        rule.conditions,
        currentValues,
        previousValues,
      );

      if (conditionsChanged) {
        requiredSteps.push(step.stepNumber);
      } else {
        skippedSteps.push(step.stepNumber);
      }
    }

    return {
      totalSteps: currentPath.steps.length,
      skippedSteps,
      requiredSteps,
      stepsSkippedCount: skippedSteps.length,
    };
  }

  // Evaluate a set of conditions against quote values
  private evaluateConditions(
    values: QuoteApprovalValues,
    conditions: ApprovalCondition[],
  ): boolean {
    // All conditions must be true (AND logic)
    return conditions.every((condition) => {
      const actualValue = this.getValueForField(values, condition.field);
      if (actualValue === undefined) return false;

      const threshold = new Decimal(condition.value);
      const actual = new Decimal(actualValue);

      switch (condition.operator) {
        case 'gt': return actual.gt(threshold);
        case 'gte': return actual.gte(threshold);
        case 'lt': return actual.lt(threshold);
        case 'lte': return actual.lte(threshold);
        case 'eq': return actual.eq(threshold);
        default: return false;
      }
    });
  }

  // Check if conditions-relevant values have changed between versions.
  // Treats undefined fields (unrecognized field names) as always-changed
  // to prevent accidental step skipping from misconfigured rules.
  private haveConditionsChanged(
    conditions: ApprovalCondition[],
    currentValues: QuoteApprovalValues,
    previousValues: QuoteApprovalValues,
  ): boolean {
    return conditions.some((condition) => {
      const currentValue = this.getValueForField(currentValues, condition.field);
      const previousValue = this.getValueForField(previousValues, condition.field);
      // If either value is undefined (field not recognized), treat as changed
      if (currentValue === undefined || previousValue === undefined) return true;
      return currentValue !== previousValue;
    });
  }

  // Extract a numeric value from quote values by field name
  private getValueForField(
    values: QuoteApprovalValues,
    field: string,
  ): number | undefined {
    switch (field) {
      case 'maxDiscountPercent': return values.maxDiscountPercent;
      case 'grandTotal': return values.grandTotal;
      case 'discountTotal': return values.discountTotal;
      case 'lineItemCount': return values.lineItemCount;
      default: return undefined;
    }
  }

  // Human-readable description of why a rule was triggered
  private describeConditions(
    conditions: ApprovalCondition[],
    values: QuoteApprovalValues,
  ): string {
    return conditions
      .map((condition) => {
        const actual = this.getValueForField(values, condition.field);
        const operatorLabel: Record<string, string> = {
          gt: '>', gte: '>=', lt: '<', lte: '<=', eq: '=',
        };
        return `${condition.field} ${operatorLabel[condition.operator] ?? condition.operator} ${condition.value} (actual: ${actual})`;
      })
      .join(' AND ');
  }
}

// Types
export type ApprovalCondition = {
  field: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
  value: number;
};

export type ApprovalRuleDefinition = {
  id: string;
  name: string;
  stepNumber: number;
  approverRole: string;
  isActive: boolean;
  conditions: ApprovalCondition[];
};

export type QuoteApprovalValues = {
  maxDiscountPercent: number;
  grandTotal: number;
  discountTotal: number;
  lineItemCount: number;
};

export type TriggeredRule = {
  ruleId: string;
  ruleName: string;
  stepNumber: number;
  approverRole: string;
  reason: string;
};

export type ApprovalPathResult = {
  requiresApproval: boolean;
  steps: TriggeredRule[];
  totalSteps: number;
};

export type PreviousApproval = {
  stepNumber: number;
  status: 'approved' | 'rejected' | 'skipped';
};

export type SmartReapprovalResult = {
  totalSteps: number;
  skippedSteps: number[];
  requiredSteps: number[];
  stepsSkippedCount: number;
};
