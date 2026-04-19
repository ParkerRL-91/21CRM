import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CpqStatusOutput {
  @Field(() => Boolean)
  isSetUp: boolean;

  @Field(() => Int)
  objectCount: number;

  @Field(() => Int)
  expectedCount: number;

  @Field(() => [String])
  foundObjects: string[];

  @Field(() => [String])
  missingObjects: string[];

  @Field(() => String)
  version: string;
}
