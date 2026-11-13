import { test, expect, type Page } from '@playwright/test';

type FulfillOptions = Parameters<import('@playwright/test').Route['fulfill']>[0];

// Everything is routed, so no server and no network are needed.
test.beforeEach(async ({ page }) => {
  await page.route('http://repro.test/', route =>
    route.fulfill({ contentType: 'text/html', body: '<title>repro</title>' }));
  await page.goto('http://repro.test/');
});

// Fulfills /data with the given options and returns what the page sees.
async function fetchData(page: Page, options: FulfillOptions) {
  await page.route('http://repro.test/data', route => route.fulfill(options));
  return await page.evaluate(async () => {
    const response = await fetch('/data');
    return { contentType: response.headers.get('content-type'), body: await response.text() };
  });
}

test.describe('controls (pass)', () => {
  test('json sets application/json', async ({ page }) => {
    expect(await fetchData(page, { json: { a: 1 } })).toEqual({ contentType: 'application/json', body: '{"a":1}' });
  });

  test('json: 1 sets application/json', async ({ page }) => {
    expect(await fetchData(page, { json: 1 })).toEqual({ contentType: 'application/json', body: '1' });
  });

  test('contentType option wins over json', async ({ page }) => {
    expect(await fetchData(page, { json: { a: 1 }, contentType: 'application/problem+json' }))
        .toEqual({ contentType: 'application/problem+json', body: '{"a":1}' });
  });

  test('headers content-type is kept with body', async ({ page }) => {
    expect(await fetchData(page, { body: '{"a":1}', headers: { 'content-type': 'application/problem+json' } }))
        .toEqual({ contentType: 'application/problem+json', body: '{"a":1}' });
  });
});

test.describe('1: json replaces a content type that is already set in headers', () => {
  for (const name of ['content-type', 'Content-Type']) {
    test(`headers: { '${name}': 'application/problem+json' } with json`, async ({ page }) => {
      expect(await fetchData(page, { json: { a: 1 }, headers: { [name]: 'application/problem+json' } }))
          .toEqual({ contentType: 'application/problem+json', body: '{"a":1}' });
    });
  }
});

test.describe('2: falsy json values get no content type', () => {
  for (const value of [null, false, 0, '']) {
    test(`json: ${JSON.stringify(value)}`, async ({ page }) => {
      expect(await fetchData(page, { json: value }))
          .toEqual({ contentType: 'application/json', body: JSON.stringify(value) });
    });
  }
});
