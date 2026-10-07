const { promisify } = require('node:util');
const { execFile } = require('node:child_process');
const path = require('node:path');
const { Client } = require('pg');
const run = promisify(execFile);

// 일회용 DB를 만들어 실제로 실행하므로 TEST_DATABASE_URL이 있을 때만 수행함
const maybe = process.env.TEST_DATABASE_URL ? test : test.skip;

// execFile 실패 시 error.code(종료 코드), stdout, stderr가 담김
const failsWith = (promise, { stdout, stderr }) =>
  expect(promise).rejects.toMatchObject({
    code: 1,
    ...(stdout && { stdout: expect.stringMatching(stdout) }),
    ...(stderr && { stderr: expect.stringMatching(stderr) }),
  });

maybe(
  'db:check uses current models, reports missing schema, and never repairs it',
  async () => {
    const admin = new Client({ connectionString: process.env.TEST_DATABASE_URL });
    await admin.connect();
    const database = `db_check_${process.pid}_${Date.now()}`;
    let client;
    try {
      await admin.query(`CREATE DATABASE "${database}"`);
      const url = new URL(process.env.TEST_DATABASE_URL);
      const env = {
        ...process.env,
        NODE_ENV: 'test',
        DIALECT: 'postgres',
        DB_HOST: url.hostname,
        DB_PORT: url.port || '5432',
        DB_NAME: database,
        DB_USER: decodeURIComponent(url.username),
        DB_PASSWORD: decodeURIComponent(url.password),
        DB_SSL: 'false',
      };
      const options = { cwd: path.resolve(__dirname, '../..'), env };
      // Only the fixture setup creates tables, in a disposable test database.
      await run(
        process.execPath,
        [
          '-e',
          "const {sequelize}=require('./src/models'); (async()=>{try{await sequelize.sync({logging:false});}finally{await sequelize.close();}})().catch(e=>{console.error(e.message);process.exitCode=1;});",
        ],
        options,
      );
      client = new Client({
        host: env.DB_HOST,
        port: Number(env.DB_PORT),
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database,
      });
      await client.connect();
      await client.query('CREATE TABLE "diagnostic""table" (id integer)');
      await client.query('INSERT INTO "diagnostic""table" VALUES (1)');

      const ok = await run('npm', ['run', 'db:check'], options);
      expect(ok.stdout).toMatch(/테이블·컬럼이 모두 존재/);
      expect(ok.stdout).toContain('"diagnostic""table": 1 행');
      expect(ok.stdout).toContain(database);

      await client.query('ALTER TABLE review DROP COLUMN content');
      await failsWith(run(process.execPath, ['scripts/db-check.js'], options), {
        stdout: /누락 컬럼: public.review.content/,
      });
      const columns = await client.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name='review' AND column_name='content'",
      );
      expect(columns.rowCount).toBe(0); // 검사가 스키마를 고치지 않음

      await client.query('DROP TABLE review');
      await failsWith(run(process.execPath, ['scripts/db-check.js'], options), {
        stdout: /누락 테이블: "review"/,
      });
      expect(
        (await client.query("SELECT to_regclass('public.review') AS relation")).rows[0].relation,
      ).toBeNull();

      await failsWith(
        run(process.execPath, ['scripts/db-check.js'], { ...options, env: { ...env, DB_PORT: '1' } }),
        { stderr: /DB 검사 실패/ },
      );
    } finally {
      if (client) await client.end();
      await admin.query(`DROP DATABASE IF EXISTS "${database}"`);
      await admin.end();
    }
  },
  30000,
);
