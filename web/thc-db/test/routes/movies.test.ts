import test from 'node:test';
import assert from 'node:assert';
import { getServer } from '../helper.js';

const MOVIES_URL = '/movies';
const MOVIE_TITLE = 'The Matrix';

void test('movies', async (t) => {
  const server = await getServer(t);

  {
    const res = await server.inject({
      method: 'GET',
      url: MOVIES_URL,
    });

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.json(), []);
  }

  let id: number;
  {
    const res = await server.inject({
      method: 'POST',
      url: MOVIES_URL,
      body: {
        title: MOVIE_TITLE,
      },
    });

    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.title, MOVIE_TITLE);
    assert.strictEqual(body.id !== undefined, true);
    id = body.id as number;
  }

  {
    const res = await server.inject({
      method: 'GET',
      url: MOVIES_URL,
    });

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.json(), [
      {
        id,
        title: MOVIE_TITLE,
      },
    ]);
  }
});
