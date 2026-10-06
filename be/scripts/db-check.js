const path = require('node:path');
const { QueryTypes } = require('sequelize');

// PostgreSQL identifiers may contain quotes; identifiers cannot use value parameters.
const quoteIdentifier = (value) => `"${String(value).replaceAll('"', '""')}"`;
const quoteTable = (table) =>
  typeof table === 'string'
    ? quoteIdentifier(table)
    : [table.schema, table.tableName].filter(Boolean).map(quoteIdentifier).join('.');

/**
 * npm run db:check
 * Local: node --env-file=.env.local scripts/db-check.js (from be/)
 * Use the same registered models/configuration as npm start; never run sync here.
 */
async function checkDatabase(sequelize, log = console.log) {
  const config = sequelize.config;
  log(`대상 DB: ${config.username}@${config.host}:${config.port}/${config.database}`);
  log(`실행 환경: ${process.env.NODE_ENV || 'development'}`);
  log(`SSL: ${sequelize.options.dialectOptions?.ssl ? '사용' : '사용 안 함'}`);
  if (sequelize.getDialect() !== 'postgres') throw new Error('이 검사는 PostgreSQL용입니다.');
  await sequelize.authenticate({ logging: false });
  log('DB 연결 성공');

  return sequelize.transaction({ logging: false }, async (transaction) => {
    const query = (sql, replacements) =>
      sequelize.query(sql, {
        transaction,
        replacements,
        type: QueryTypes.SELECT,
        logging: false,
      });
    await sequelize.query('SET TRANSACTION READ ONLY', { transaction, logging: false });
    const [context] = await query(
      'SELECT current_database() AS database, current_user AS username, current_schemas(false)::text[] AS schemas',
    );
    log(
      `접속 확인: ${context.username}@${context.database} / 검색 스키마: ${context.schemas.join(', ')}`,
    );
    const models = Object.values(sequelize.models);
    if (!models.length)
      throw new Error('등록된 모델이 없습니다. src/models/index.js를 확인하세요.');
    log(`등록된 모델: ${models.map((model) => model.name).join(', ')}`);

    const schemas = [
      ...new Set([
        ...context.schemas,
        ...models.map((model) => model.getTableName().schema).filter(Boolean),
      ]),
    ];
    const actual = await query(
      `
      SELECT n.nspname AS schema_name, c.relname AS table_name
      FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname IN (:schemas) AND c.relkind IN ('r', 'p')
      ORDER BY n.nspname, c.relname
    `,
      { schemas },
    );
    log(
      `실제 테이블: ${actual.map((row) => `${row.schema_name}.${row.table_name}`).join(', ') || '(없음)'}`,
    );
    const missingTables = [];
    const missingColumns = [];
    for (const model of models) {
      // Resolve unqualified names using the DB's actual search_path, just like model queries.
      const reference = quoteTable(model.getTableName());
      const [table] = await query(
        `
        SELECT c.oid, n.nspname AS schema_name, c.relname AS table_name
        FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE c.oid = to_regclass(:reference) AND c.relkind IN ('r', 'p')
      `,
        { reference },
      );
      if (!table) {
        missingTables.push(reference);
        continue;
      }
      const columns = await query(
        `
        SELECT attname FROM pg_catalog.pg_attribute
        WHERE attrelid = :oid AND attnum > 0 AND NOT attisdropped
      `,
        { oid: table.oid },
      );
      const names = new Set(columns.map((column) => column.attname));
      for (const [name, attribute] of Object.entries(model.getAttributes())) {
        if (attribute.type.key === 'VIRTUAL') continue;
        const field = attribute.field || name;
        if (!names.has(field))
          missingColumns.push(`${table.schema_name}.${table.table_name}.${field}`);
      }
    }

    log(`누락 테이블: ${missingTables.join(', ') || '(없음)'}`);
    log(`누락 컬럼: ${missingColumns.join(', ') || '(없음)'}`);
    log('테이블별 전체 행 수 (소프트 삭제된 행 포함):');
    for (const table of actual) {
      const qualified = quoteTable({ schema: table.schema_name, tableName: table.table_name });
      const [row] = await query(`SELECT COUNT(*) AS count FROM ${qualified}`);
      log(`  ${qualified}: ${row.count} 행`);
    }
    const ok = !missingTables.length && !missingColumns.length;
    log(
      ok
        ? '등록된 모델의 테이블·컬럼이 모두 존재합니다.'
        : '모델과 DB가 일치하지 않습니다. 연결 대상 및 DB 스키마를 확인하세요.',
    );
    log('읽기 전용 검사입니다. 컬럼 타입·제약·인덱스의 일치 여부는 검사하지 않습니다.');
    return { ok, missingTables, missingColumns };
  });
}

async function main() {
  if (process.argv.length > 2)
    throw new Error(
      '사용법: npm run db:check. 로컬은 node --env-file=.env.local scripts/db-check.js로 실행하세요.',
    );
  // Resolve .env from be/, even when the script is called from the repository root.
  // Existing environment values (including --env-file) take precedence.
  require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
  const { sequelize } = require('../src/models');
  try {
    const result = await checkDatabase(sequelize);
    if (!result.ok) process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('DB 검사 실패:', error.message);
    process.exitCode = 1;
  });
}
module.exports = { checkDatabase };
