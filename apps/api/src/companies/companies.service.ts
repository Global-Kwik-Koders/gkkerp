import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.module';

@Injectable()
export class CompaniesService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  findById(id: string) {
    return this.knex('companies').where({ id }).first();
  }

  update(id: string, data: Partial<{ name: string; settings: any }>) {
    return this.knex('companies').where({ id }).update({ ...data, updated_at: new Date() });
  }
}
