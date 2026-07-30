import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import knex, { Knex } from 'knex';

export const KNEX_CONNECTION = 'KNEX_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: KNEX_CONNECTION,
      useFactory: (config: ConfigService): Knex => {
        return knex({
          client: 'mysql2',
          connection: {
            host: config.get('DB_HOST', 'localhost'),
            port: config.get<number>('DB_PORT', 3306),
            database: config.get('DB_NAME', 'gkkerp'),
            user: config.get('DB_USER', 'root'),
            password: config.get('DB_PASSWORD', 'secret'),
          },
          pool: { min: 2, max: 10 },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [KNEX_CONNECTION],
})
export class DatabaseModule {}
