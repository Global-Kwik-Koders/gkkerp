import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.module';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UsersService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async findById(id: string) {
    return this.knex('users').where({ id }).first();
  }

  async findByEmail(email: string) {
    return this.knex('users').where({ email }).first();
  }

  async findByCompany(companyId: string) {
    return this.knex('users as u')
      .where('u.company_id', companyId)
      .leftJoin('departments as d', 'u.department_id', 'd.id')
      .select(
        'u.id', 'u.email', 'u.first_name', 'u.last_name', 'u.role',
        'u.job_title', 'u.avatar_url', 'u.department_id', 'u.is_active', 'u.created_at',
        'd.name as department_name',
      )
      .orderBy('u.first_name');
  }

  async update(id: string, data: Partial<{ first_name: string; last_name: string; job_title: string; avatar_url: string; department_id: string; role: string; is_active: boolean }>) {
    await this.knex('users').where({ id }).update({ ...data, updated_at: new Date() });
    return this.findById(id);
  }

  async createEmployee(companyId: string, data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: string;
    job_title?: string;
    department_id?: string;
  }) {
    const existing = await this.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already in use');
    const id = uuid();
    const password_hash = await bcrypt.hash(data.password, 10);
    await this.knex('users').insert({
      id,
      company_id: companyId,
      email: data.email,
      password_hash,
      first_name: data.first_name,
      last_name: data.last_name,
      role: data.role ?? 'employee',
      job_title: data.job_title ?? null,
      department_id: data.department_id ?? null,
      is_active: true,
    });
    return this.findByCompany(companyId).then((list) => list.find((u: any) => u.id === id));
  }

  async remove(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    await this.knex('users').where({ id }).update({ is_active: false, updated_at: new Date() });
  }
}
