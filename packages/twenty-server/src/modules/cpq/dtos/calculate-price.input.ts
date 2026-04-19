import { Field, Float, InputType, Int } from '@nestjs/graphql';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class DiscountTierInput {
  @IsInt()
  @Min(0)
  @Field(() => Int)
  lowerBound: number;

  @Field(() => Int, { nullable: true })
  upperBound: number | null;

  @IsNumber()
  @Field(() => Float)
  value: number;
}

@InputType()
export class DiscountScheduleInput {
  @IsIn(['tiered', 'volume', 'term'])
  @Field(() => String)
  type: 'tiered' | 'volume' | 'term';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiscountTierInput)
  @Field(() => [DiscountTierInput])
  tiers: DiscountTierInput[];
}

@InputType()
export class CalculatePriceInput {
  @IsString()
  @Field(() => String)
  listPrice: string;

  @IsInt()
  @Min(0)
  @Field(() => Int)
  quantity: number;

  @IsInt()
  @IsOptional()
  @Field(() => Int, { nullable: true })
  productBaseTermMonths?: number;

  @IsInt()
  @IsOptional()
  @Field(() => Int, { nullable: true })
  quoteTermMonths?: number;

  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  contractedPrice?: string;

  @ValidateNested()
  @Type(() => DiscountScheduleInput)
  @IsOptional()
  @Field(() => DiscountScheduleInput, { nullable: true })
  discountSchedule?: DiscountScheduleInput;

  @IsNumber()
  @IsOptional()
  @Field(() => Float, { nullable: true })
  manualDiscountPercent?: number;

  @IsNumber()
  @IsOptional()
  @Field(() => Float, { nullable: true })
  manualDiscountAmount?: number;

  @IsNumber()
  @IsOptional()
  @Field(() => Float, { nullable: true })
  manualPriceOverride?: number;

  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  floorPrice?: string;
}
