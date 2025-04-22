import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

export const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations'
  }
}); 