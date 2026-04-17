import { CpqApprovalService } from './cpq-approval.service';

import type {
  ApprovalRuleDefinition,
  QuoteApprovalValues,
  PreviousApproval,
} from './cpq-approval.service';

describe('CpqApprovalService', () => {
  let service: CpqApprovalService;

  const standardRules: ApprovalRuleDefinition[] = [
    {
      id: 'rule-1', name: 'Sales Manager (>15%)', stepNumber: 1,
      approverRole: 'sales_manager', isActive: true,
      conditions: [{ field: 'maxDiscountPercent', operator: 'gt', value: 15 }],
    },
    {
      id: 'rule-2', name: 'VP Sales (>25%)', stepNumber: 2,
      approverRole: 'vp_sales', isActive: true,
      conditions: [{ field: 'maxDiscountPercent', operator: 'gt', value: 25 }],
    },
    {
      id: 'rule-3', name: 'CFO (>40%)', stepNumber: 3,
      approverRole: 'cfo', isActive: true,
      conditions: [{ field: 'maxDiscountPercent', operator: 'gt', value: 40 }],
    },
    {
      id: 'rule-4', name: 'Large Deal Review', stepNumber: 1,
      approverRole: 'sales_manager', isActive: true,
      conditions: [{ field: 'grandTotal', operator: 'gt', value: 100000 }],
    },
  ];

  beforeEach(() => {
    service = new CpqApprovalService();
  });

  describe('evaluateRules', () => {
    it('should require no approval for small discounts', () => {
      const values: QuoteApprovalValues = {
        maxDiscountPercent: 10,
        grandTotal: 50000,
        discountTotal: 5000,
        lineItemCount: 3,
      };

      const result = service.evaluateRules(values, standardRules);

      expect(result.requiresApproval).toBe(false);
      expect(result.steps).toHaveLength(0);
    });

    it('should trigger sales manager for 20% discount', () => {
      const values: QuoteApprovalValues = {
        maxDiscountPercent: 20,
        grandTotal: 50000,
        discountTotal: 10000,
        lineItemCount: 3,
      };

      const result = service.evaluateRules(values, standardRules);

      expect(result.requiresApproval).toBe(true);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].approverRole).toBe('sales_manager');
    });

    it('should trigger two levels for 30% discount', () => {
      const values: QuoteApprovalValues = {
        maxDiscountPercent: 30,
        grandTotal: 50000,
        discountTotal: 15000,
        lineItemCount: 3,
      };

      const result = service.evaluateRules(values, standardRules);

      expect(result.requiresApproval).toBe(true);
      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].approverRole).toBe('sales_manager');
      expect(result.steps[1].approverRole).toBe('vp_sales');
    });

    it('should trigger all three levels for 50% discount', () => {
      const values: QuoteApprovalValues = {
        maxDiscountPercent: 50,
        grandTotal: 50000,
        discountTotal: 25000,
        lineItemCount: 3,
      };

      const result = service.evaluateRules(values, standardRules);

      expect(result.steps).toHaveLength(3);
    });

    it('should trigger large deal review for >$100K', () => {
      const values: QuoteApprovalValues = {
        maxDiscountPercent: 5,
        grandTotal: 150000,
        discountTotal: 7500,
        lineItemCount: 5,
      };

      const result = service.evaluateRules(values, standardRules);

      expect(result.requiresApproval).toBe(true);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].ruleName).toBe('Large Deal Review');
    });

    it('should skip inactive rules', () => {
      const rulesWithInactive = standardRules.map((rule) =>
        rule.id === 'rule-1' ? { ...rule, isActive: false } : rule,
      );

      const values: QuoteApprovalValues = {
        maxDiscountPercent: 20,
        grandTotal: 50000,
        discountTotal: 10000,
        lineItemCount: 3,
      };

      const result = service.evaluateRules(values, rulesWithInactive);

      // Rule-1 (sales manager) is inactive, so no approval needed for 20%
      expect(result.requiresApproval).toBe(false);
    });

    it('should include reason description in triggered rules', () => {
      const values: QuoteApprovalValues = {
        maxDiscountPercent: 20,
        grandTotal: 50000,
        discountTotal: 10000,
        lineItemCount: 3,
      };

      const result = service.evaluateRules(values, standardRules);

      expect(result.steps[0].reason).toContain('maxDiscountPercent');
      expect(result.steps[0].reason).toContain('15');
      expect(result.steps[0].reason).toContain('20');
    });
  });

  describe('smartReapproval', () => {
    it('should skip unchanged steps on resubmit', () => {
      const currentValues: QuoteApprovalValues = {
        maxDiscountPercent: 30, grandTotal: 50000, discountTotal: 15000, lineItemCount: 3,
      };
      // Previous values were the same — discount was already approved
      const previousValues: QuoteApprovalValues = {
        maxDiscountPercent: 30, grandTotal: 50000, discountTotal: 15000, lineItemCount: 3,
      };
      const previousApprovals: PreviousApproval[] = [
        { stepNumber: 1, status: 'approved' },
        { stepNumber: 2, status: 'rejected' }, // VP rejected, rep corrected something else
      ];

      const result = service.smartReapproval(
        currentValues, previousValues, previousApprovals, standardRules,
      );

      // Step 1 should be skipped (approved + values unchanged)
      expect(result.skippedSteps).toContain(1);
      // Step 2 should be required (was rejected)
      expect(result.requiredSteps).toContain(2);
    });

    it('should require re-approval when discount changed', () => {
      const currentValues: QuoteApprovalValues = {
        maxDiscountPercent: 35, grandTotal: 50000, discountTotal: 17500, lineItemCount: 3,
      };
      const previousValues: QuoteApprovalValues = {
        maxDiscountPercent: 30, grandTotal: 50000, discountTotal: 15000, lineItemCount: 3,
      };
      const previousApprovals: PreviousApproval[] = [
        { stepNumber: 1, status: 'approved' },
      ];

      const result = service.smartReapproval(
        currentValues, previousValues, previousApprovals, standardRules,
      );

      // Discount changed — step 1 needs re-approval
      expect(result.requiredSteps).toContain(1);
      expect(result.skippedSteps).not.toContain(1);
    });

    it('should require all steps when no previous approvals exist', () => {
      const values: QuoteApprovalValues = {
        maxDiscountPercent: 30, grandTotal: 50000, discountTotal: 15000, lineItemCount: 3,
      };

      const result = service.smartReapproval(values, values, [], standardRules);

      expect(result.requiredSteps.length).toBe(result.totalSteps);
      expect(result.skippedSteps).toHaveLength(0);
    });
  });
});
