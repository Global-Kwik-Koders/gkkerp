import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../database/database.module';
import { DeptNotifierService } from '../dept-notifier.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class PerformanceService {
  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    private readonly deptNotifier: DeptNotifierService,
  ) {}

  findAll(companyId: string, userId: string, role: string) {
    const q = this.knex('performance_reviews as pr')
      .where('pr.company_id', companyId)
      .leftJoin('users as reviewer', 'pr.reviewer_id', 'reviewer.id')
      .leftJoin('users as reviewee', 'pr.reviewee_id', 'reviewee.id')
      .select(
        'pr.*',
        this.knex.raw("CONCAT(reviewer.first_name, ' ', reviewer.last_name) as reviewer_name"),
        this.knex.raw("CONCAT(reviewee.first_name, ' ', reviewee.last_name) as reviewee_name"),
      )
      .orderBy('pr.created_at', 'desc');

    if (role === 'employee') {
      q.where(function () {
        this.where('pr.reviewer_id', userId).orWhere('pr.reviewee_id', userId);
      });
    }

    return q;
  }

  findById(id: string) {
    return this.knex('performance_reviews as pr')
      .where('pr.id', id)
      .leftJoin('users as reviewer', 'pr.reviewer_id', 'reviewer.id')
      .leftJoin('users as reviewee', 'pr.reviewee_id', 'reviewee.id')
      .select(
        'pr.*',
        this.knex.raw("CONCAT(reviewer.first_name, ' ', reviewer.last_name) as reviewer_name"),
        this.knex.raw("CONCAT(reviewee.first_name, ' ', reviewee.last_name) as reviewee_name"),
      )
      .first();
  }

  async create(companyId: string, reviewerId: string, data: {
    reviewee_id: string;
    period: string;
    score?: number;
    feedback?: string;
    goals?: string;
  }) {
    const id = uuid();
    await this.knex('performance_reviews').insert({
      id,
      company_id: companyId,
      reviewer_id: reviewerId,
      ...data,
      status: 'draft',
    });

    // Notify dept head of the reviewee that a review was created for them
    const reviewer = await this.knex('users').where({ id: reviewerId }).select('first_name', 'last_name').first();
    const reviewee = await this.knex('users').where({ id: data.reviewee_id }).select('first_name', 'last_name').first();
    if (reviewer && reviewee) {
      await this.deptNotifier.notifyHead(data.reviewee_id, {
        type: 'performance_review_created',
        title: 'Performance review created',
        body: `${reviewer.first_name} ${reviewer.last_name} created a review for ${reviewee.first_name} ${reviewee.last_name} — ${data.period}`,
        data: { review_id: id },
      });
    }

    return this.findById(id);
  }

  async update(id: string, userId: string, data: {
    status?: string;
    score?: number;
    feedback?: string;
    goals?: string;
    period?: string;
    reviewee_id?: string;
  }) {
    const review = await this.knex('performance_reviews').where({ id }).first();
    if (!review) throw new ForbiddenException('Review not found');
    if (review.reviewer_id !== userId && review.reviewee_id !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    await this.knex('performance_reviews').where({ id }).update({ ...data, updated_at: new Date() });

    // Notify dept head when review is submitted
    if (data.status === 'submitted') {
      const reviewer = await this.knex('users').where({ id: review.reviewer_id }).select('first_name', 'last_name').first();
      const reviewee = await this.knex('users').where({ id: review.reviewee_id }).select('first_name', 'last_name').first();
      if (reviewer && reviewee) {
        await this.deptNotifier.notifyHead(review.reviewee_id, {
          type: 'performance_review_submitted',
          title: 'Performance review submitted',
          body: `${reviewer.first_name} ${reviewer.last_name} submitted a review for ${reviewee.first_name} ${reviewee.last_name}`,
          data: { review_id: id },
        });
      }
    }

    return this.findById(id);
  }

  remove(id: string) {
    return this.knex('performance_reviews').where({ id }).delete();
  }
}
