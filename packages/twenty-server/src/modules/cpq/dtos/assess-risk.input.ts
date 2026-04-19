import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsInt, IsNumber, IsString, Min } from 'class-validator';

@InputType()
export class AssessRiskInput {
  @IsInt()
  @Min(0)
  @Field(() => Int)
  daysSinceLastStageChange: number;

  @IsString()
  @Field(() => String)
  dealCloseDate: string;

  @IsString()
  @Field(() => String)
  contractEndDate: string;

  @IsInt()
  @Min(0)
  @Field(() => Int)
  daysUntilExpiry: number;

  @IsBoolean()
  @Field(() => Boolean)
  inFinalStage: boolean;

  @IsNumber()
  @Field(() => Float)
  currentValue: number;

  @IsNumber()
  @Field(() => Float)
  proposedValue: number;

  @IsInt()
  @Min(0)
  @Field(() => Int)
  daysSinceLastActivity: number;

  @IsBoolean()
  @Field(() => Boolean)
  hasPreviousChurn: boolean;
}
