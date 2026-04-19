import { Field, Float, InputType, Int } from '@nestjs/graphql';

@InputType()
export class DiscountTierInput {
  @Field(() => Int)
  lowerBound: number;

  @Field(() => Int, { nullable: true })
  upperBound: number | null;

  @Field(() => Float)
  value: number;
}

@InputType()
export class DiscountScheduleInput {
  @Field(() => String)
  type: 'tiered' | 'volume' | 'term';

  @Field(() => [DiscountTierInput])
  tiers: DiscountTierInput[];
}

@InputType()
export class CalculatePriceInput {
  @Field(() => String)
  listPrice: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Int, { nullable: true })
  productBaseTermMonths?: number;

  @Field(() => Int, { nullable: true })
  quoteTermMonths?: number;

  @Field(() => String, { nullable: true })
  contractedPrice?: string;

  @Field(() => DiscountScheduleInput, { nullable: true })
  discountSchedule?: DiscountScheduleInput;

  @Field(() => Float, { nullable: true })
  manualDiscountPercent?: number;

  @Field(() => Float, { nullable: true })
  manualDiscountAmount?: number;

  @Field(() => Float, { nullable: true })
  manualPriceOverride?: number;

  @Field(() => String, { nullable: true })
  floorPrice?: string;
}
