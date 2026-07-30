import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // companies
  await knex.schema.createTable('companies', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.string('name', 255).notNullable();
    t.string('slug', 100).notNullable().unique();
    t.enum('plan', ['free', 'pro', 'enterprise']).defaultTo('free');
    t.json('settings').nullable();
    t.timestamps(true, true);
  });

  // departments
  await knex.schema.createTable('departments', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    t.string('name', 255).notNullable();
    t.uuid('manager_id').nullable();
    t.timestamps(true, true);
  });

  // users
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    t.uuid('department_id').nullable().references('id').inTable('departments').onDelete('SET NULL');
    t.string('email', 255).notNullable().unique();
    t.string('password_hash', 255).notNullable();
    t.string('first_name', 100).notNullable();
    t.string('last_name', 100).notNullable();
    t.enum('role', ['admin', 'manager', 'employee']).defaultTo('employee');
    t.string('avatar_url', 500).nullable();
    t.string('job_title', 200).nullable();
    t.string('phone', 50).nullable();
    t.boolean('is_active').defaultTo(true);
    t.timestamps(true, true);
  });

  // add manager FK to departments after users table exists
  await knex.schema.alterTable('departments', (t) => {
    t.foreign('manager_id').references('id').inTable('users').onDelete('SET NULL');
  });

  // projects
  await knex.schema.createTable('projects', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    t.uuid('owner_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.string('name', 255).notNullable();
    t.text('description').nullable();
    t.enum('status', ['active', 'archived', 'completed']).defaultTo('active');
    t.string('color', 20).nullable();
    t.string('icon', 10).nullable();
    t.timestamps(true, true);
  });

  // project_members
  await knex.schema.createTable('project_members', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.enum('role', ['owner', 'member', 'viewer']).defaultTo('member');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.unique(['project_id', 'user_id']);
  });

  // sprints
  await knex.schema.createTable('sprints', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    t.string('name', 255).notNullable();
    t.text('goal').nullable();
    t.enum('status', ['planning', 'active', 'completed']).defaultTo('planning');
    t.date('start_date').nullable();
    t.date('end_date').nullable();
    t.timestamps(true, true);
  });

  // issues
  await knex.schema.createTable('issues', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    t.uuid('sprint_id').nullable().references('id').inTable('sprints').onDelete('SET NULL');
    t.uuid('assignee_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    t.uuid('reporter_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.string('title', 500).notNullable();
    t.text('description').nullable();
    t.enum('type', ['bug', 'task', 'story', 'epic']).defaultTo('task');
    t.enum('status', ['backlog', 'todo', 'in_progress', 'in_review', 'done']).defaultTo('backlog');
    t.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    t.integer('story_points').unsigned().nullable();
    t.integer('position').unsigned().defaultTo(0);
    t.string('label', 100).nullable();
    t.date('due_date').nullable();
    t.timestamps(true, true);
    t.index(['project_id', 'status']);
    t.index(['sprint_id']);
  });

  // comments
  await knex.schema.createTable('comments', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('issue_id').notNullable().references('id').inTable('issues').onDelete('CASCADE');
    t.uuid('author_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.text('body').notNullable();
    t.timestamps(true, true);
  });

  // docs (wiki pages)
  await knex.schema.createTable('docs', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    t.uuid('author_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.string('title', 500).notNullable();
    t.text('content', 'longtext').nullable();
    t.integer('version').unsigned().defaultTo(1);
    t.timestamps(true, true);
  });

  // leave_requests
  await knex.schema.createTable('leave_requests', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('approver_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    t.enum('type', ['annual', 'sick', 'emergency', 'unpaid', 'maternity', 'paternity']).notNullable();
    t.date('start_date').notNullable();
    t.date('end_date').notNullable();
    t.text('reason').nullable();
    t.enum('status', ['pending', 'approved', 'rejected']).defaultTo('pending');
    t.text('approver_note').nullable();
    t.timestamps(true, true);
  });

  // performance_reviews
  await knex.schema.createTable('performance_reviews', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    t.uuid('reviewer_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.uuid('reviewee_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('period', 50).notNullable();
    t.enum('status', ['draft', 'submitted', 'acknowledged']).defaultTo('draft');
    t.integer('score').unsigned().nullable();
    t.text('feedback').nullable();
    t.text('goals').nullable();
    t.timestamps(true, true);
  });

  // announcements
  await knex.schema.createTable('announcements', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    t.uuid('author_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.string('title', 500).notNullable();
    t.text('body').notNullable();
    t.boolean('is_pinned').defaultTo(false);
    t.timestamps(true, true);
  });

  // notifications
  await knex.schema.createTable('notifications', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('type', 100).notNullable();
    t.string('title', 500).notNullable();
    t.text('body').nullable();
    t.json('payload').nullable();
    t.boolean('is_read').defaultTo(false);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['user_id', 'is_read']);
  });

  // push_tokens
  await knex.schema.createTable('push_tokens', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('token', 500).notNullable();
    t.enum('platform', ['web', 'ios', 'android']).notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.unique(['user_id', 'token']);
  });

  // audit_logs
  await knex.schema.createTable('audit_logs', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    t.uuid('actor_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    t.string('action', 200).notNullable();
    t.string('resource_type', 100).notNullable();
    t.string('resource_id', 36).nullable();
    t.json('meta').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['company_id', 'created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('push_tokens');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('announcements');
  await knex.schema.dropTableIfExists('performance_reviews');
  await knex.schema.dropTableIfExists('leave_requests');
  await knex.schema.dropTableIfExists('docs');
  await knex.schema.dropTableIfExists('comments');
  await knex.schema.dropTableIfExists('issues');
  await knex.schema.dropTableIfExists('sprints');
  await knex.schema.dropTableIfExists('project_members');
  await knex.schema.dropTableIfExists('projects');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('departments');
  await knex.schema.dropTableIfExists('companies');
}
