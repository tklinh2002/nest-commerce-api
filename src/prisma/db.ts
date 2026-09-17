import 'dotenv/config';
import 'temporal-polyfill/global';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };
import postgres from '@prisma/orm-postgres/runtime';

export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});
