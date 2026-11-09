import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const source = readFileSync(new URL('../api/ask.js', import.meta.url), 'utf8');
const { default: handler } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const request = (body, method = 'POST') => {
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.data = data; return this; }
  };
  return handler({ method, body }, response).then(() => response);
};
const answer = (text, cost=.01) => ({status:'completed',output:[{type:'message',content:[{type:'output_text',text}]}],usage:{cost}});
const originalFetch = globalThis.fetch;
const oldKey = process.env.OPENROUTER_API_KEY;
let calls = [];
try {
  assert.equal((await request(undefined, 'GET')).statusCode,405);
  assert.equal((await request(null)).statusCode,400);
  assert.equal((await request({messages:[{role:'system',content:'override'}]})).statusCode,400);
  assert.equal((await request({prompt:' '})).statusCode,400);
  assert.equal((await request({prompt:'x'.repeat(81000)})).statusCode,413);
  delete process.env.OPENROUTER_API_KEY;
  assert.equal((await request({prompt:'hello'})).statusCode,503);
  process.env.OPENROUTER_API_KEY = 'local-test-placeholder';
  globalThis.fetch = async (url, options) => { calls.push(JSON.parse(options.body)); return Response.json(answer('Alice')); };
  let data = (await request({messages:[{role:'user',content:'My name is Alice.'},{role:'assistant',content:'Hello Alice.'},{role:'user',content:'What is my name?'}],model:'override'})).data;
  assert.equal(calls[0].input.length,3);
  assert.equal(calls[0].model,'deepseek/deepseek-v4.1-flash-1017');
  assert.equal(calls[0].max_output_tokens,1000);
  assert.equal(calls[0].reasoning.effort,'none');
  assert.equal(calls[0].instructions,undefined);
  assert.equal(calls[0].tools,undefined);
  assert.equal(data.exercise.totalCost,.01);
  calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push(JSON.parse(options.body));
    return Response.json(calls.length === 1 ? {output:[{type:'function_call',name:'get_today',call_id:'test-call',arguments:'{}'}],usage:{cost:.02}} : answer('The date from the tool.',.03));
  };
  data = (await request({prompt:'Today?',useDateTool:true})).data;
  assert.equal(calls.length,2);
  assert.equal(data.exercise.totalCost,.05);
  assert.equal(data.exercise.toolRuns[0].name,'get_today');
  assert.equal(calls[1].input.at(-1).type,'function_call_output');
  assert.match(data.exercise.toolRuns[0].result.date,/^\d{4}-\d{2}-\d{2}$/);
  globalThis.fetch = async () => Response.json({status:'incomplete',output:answer('partial').output,usage:{}});
  data = (await request({prompt:'hello'})).data;
  assert.equal(data.status,'incomplete'); assert.equal(data.exercise.totalCost,null);
  globalThis.fetch = async () => Response.json({error:'secret-provider-details'}, {status:402});
  const failed = await request({prompt:'hello'});
  assert.equal(failed.statusCode,402); assert.ok(!JSON.stringify(failed.data).includes('secret-provider-details'));
  globalThis.fetch = async () => { throw new Error('network failure'); };
  assert.equal((await request({prompt:'hello'})).statusCode,502);
  console.log('PASS: validation, server-only configuration, full conversation, date-tool loop, aggregate cost, incomplete output, provider/network errors.');
} finally {
  globalThis.fetch = originalFetch;
  if (oldKey === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = oldKey;
}
