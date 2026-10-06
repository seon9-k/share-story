const { test } = require('node:test');
const assert = require('node:assert/strict');
const { promisify } = require('node:util');
const { execFile } = require('node:child_process');
const path = require('node:path');
const { Client } = require('pg');
const run = promisify(execFile);

test(
  'db:check uses current models, reports missing schema, and never repairs it',
  {
    skip: !process.env.TEST_DATABASE_URL,
    timeout: 30000,
  },
  async (t) => {
    const admin = new Client({ connectionString: process.env.TEST_DATABASE_URL });
    await admin.connect();
    const database = `db_check_${process.pid}_${Date.now()}`;
    let client;
    t.after(async () => {
      if (client) await client.end();
      await admin.query(`DROP DATABASE IF EXISTS "${database}"`);
      await admin.end();
    });
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
    const options = { cwd: path.resolve(__dirname, '..'), env };
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
    assert.match(ok.stdout, /테이블·컬럼이 모두 존재/);
    assert.ok(ok.stdout.includes('"diagnostic""table": 1 행'));
    assert.ok(ok.stdout.includes(database));
    await client.query('ALTER TABLE review DROP COLUMN content');
    await assert.rejects(run(process.execPath, ['scripts/db-check.js'], options), (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stdout, /누락 컬럼: public.review.content/);
      return true;
    });
    const columns = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='review' AND column_name='content'",
    );
    assert.equal(columns.rowCount, 0);
    await client.query('DROP TABLE review');
    await assert.rejects(run(process.execPath, ['scripts/db-check.js'], options), (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stdout, /누락 테이블: "review"/);
      return true;
    });
    assert.equal(
      (await client.query("SELECT to_regclass('public.review') AS relation")).rows[0].relation,
      null,
    );
    await assert.rejects(
      run(process.execPath, ['scripts/db-check.js'], { ...options, env: { ...env, DB_PORT: '1' } }),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /DB 검사 실패/);
        return true;
      },
    );
  },
);
