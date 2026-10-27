import { Resolver, Query, Args } from '@nestjs/graphql';
import { CategoryService } from './category.service';
import { CategoryType } from '../common/types/graphql.types';

@Resolver(() => CategoryType)
export class CategoryResolver {
  constructor(private categoryService: CategoryService) {}

  @Query(() => [CategoryType])
  async getCategories() {
    return this.categoryService.getCategories();
  }

  @Query(() => CategoryType, { nullable: true })
  async getCategory(@Args('id') id: string) {
    return this.categoryService.getCategoryById(id);
  }
}
