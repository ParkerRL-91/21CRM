import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SetupResultOutput {
  @Field(() => [String])
  objectsCreated: string[];

  @Field(() => Int)
  fieldsCreated: number;

  @Field(() => Int)
  relationsCreated: number;

  @Field(() => [String])
  skipped: string[];

  @Field(() => [String])
  errors: string[];
}

@ObjectType()
export class TeardownResultOutput {
  @Field(() => [String])
  objectsRemoved: string[];

  @Field(() => [String])
  errors: string[];
}
