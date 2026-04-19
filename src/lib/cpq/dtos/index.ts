// Product DTOs
export {
  ProductType,
  ChargeType,
  BillingFrequency,
  CreateProductDto,
  UpdateProductDto,
  ListProductsQueryDto,
} from './product.dto';

export type {
  CreateProductDtoType,
  UpdateProductDtoType,
  ListProductsQueryDtoType,
} from './product.dto';

// Price book DTOs
export {
  CreatePriceBookDto,
  UpdatePriceBookDto,
  CreatePriceBookEntryDto,
  UpdatePriceBookEntryDto,
} from './price-book.dto';

export type {
  CreatePriceBookDtoType,
  UpdatePriceBookDtoType,
  CreatePriceBookEntryDtoType,
  UpdatePriceBookEntryDtoType,
} from './price-book.dto';

// Quote DTOs
export {
  QuoteStatus,
  QuoteType,
  AcceptanceMethod,
  RejectionReason,
  CreateQuoteDto,
  UpdateQuoteDto,
  AddQuoteLineItemDto,
  UpdateQuoteLineItemDto,
  TransitionQuoteStatusDto,
  AcceptQuoteDto,
  RejectQuoteDto,
} from './quote.dto';

export type {
  QuoteStatusType,
  QuoteTypeType,
  CreateQuoteDtoType,
  UpdateQuoteDtoType,
  AddQuoteLineItemDtoType,
  UpdateQuoteLineItemDtoType,
  TransitionQuoteStatusDtoType,
  AcceptQuoteDtoType,
  RejectQuoteDtoType,
} from './quote.dto';

// Discount DTOs
export {
  DiscountScheduleType,
  DiscountUnit,
  CreateDiscountScheduleDto,
  UpdateDiscountScheduleDto,
  CreateDiscountTierDto,
  UpdateDiscountTierDto,
} from './discount.dto';

export type {
  DiscountScheduleTypeType,
  DiscountUnitType,
  CreateDiscountScheduleDtoType,
  UpdateDiscountScheduleDtoType,
  CreateDiscountTierDtoType,
  UpdateDiscountTierDtoType,
} from './discount.dto';

// Approval DTOs
export {
  ApprovalStatus,
  ApprovalConditionOperator,
  ApprovalConditionValueDto,
  ApprovalConditionsDto,
  CreateApprovalRuleDto,
  UpdateApprovalRuleDto,
  SubmitApprovalRequestDto,
  ApprovalDecisionDto,
} from './approval.dto';

export type {
  ApprovalStatusType,
  ApprovalConditionsDtoType,
  CreateApprovalRuleDtoType,
  UpdateApprovalRuleDtoType,
  SubmitApprovalRequestDtoType,
  ApprovalDecisionDtoType,
} from './approval.dto';
