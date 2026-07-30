import { Knex } from 'knex';

export async function up(knex: Knex) {
  await knex.schema.createTable('leave_packages', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    t.uuid('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.string('name', 255).notNullable();
    t.date('period_start').notNullable();
    t.date('period_end').notNullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable('leave_package_types', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('package_id').notNullable().references('id').inTable('leave_packages').onDelete('CASCADE');
    t.string('leave_type', 50).notNullable();
    t.integer('days_allowed').notNullable().defaultTo(0);
    t.unique(['package_id', 'leave_type']);
  });

  await knex.schema.createTable('employee_leave_packages', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('package_id').notNullable().references('id').inTable('leave_packages').onDelete('CASCADE');
    t.timestamp('allocated_at').defaultTo(knex.fn.now());
    t.unique(['user_id', 'package_id']);
  });
}

export async function down(knex: Knex) {
  await knex.schema.dropTableIfExists('employee_leave_packages');
  await knex.schema.dropTableIfExists('leave_package_types');
  await knex.schema.dropTableIfExists('leave_packages');
}
