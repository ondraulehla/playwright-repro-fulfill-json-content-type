# route.fulfill({ json }) and the content type

Minimal reproduction for Playwright 1.65.1.

The docs for the `json` option of `route.fulfill` say: "JSON response. This method will set the content type to `application/json` if not set."

Two things don't match that sentence:

1. A content type that is already set through `headers` is replaced by `application/json`.
2. `json: null`, `json: false`, `json: 0` and `json: ''` get no content type from Playwright at all. The body is still serialized (`null`, `false`, `0`, `""`).

## Run

```sh
npm install
npx playwright install
npx playwright test
```

Everything is routed, so the tests need no server and no network.

## Result

18 of the 30 tests fail, the same 6 in Chromium, Firefox and WebKit. The 4 control tests pass in all three browsers.

| `fulfill` options | Expected | Chromium | Firefox | WebKit |
|---|---|---|---|---|
| `json: { a: 1 }, headers: { 'content-type': 'application/problem+json' }` | `application/problem+json` | `application/json` | `application/json` | `application/json` |
| `json: { a: 1 }, headers: { 'Content-Type': 'application/problem+json' }` | `application/problem+json` | `application/json` | `application/json` | `application/json` |
| `json: null` | `application/json` | no header | no header | `text/plain` |
| `json: false` | `application/json` | no header | no header | `text/plain` |
| `json: 0` | `application/json` | no header | no header | `text/plain` |
| `json: ''` | `application/json` | no header | no header | `text/plain` |

"no header" means `response.headers.get('content-type')` is `null` in the page.

I got the same table on macOS (arm64, Node 26.5.0) and on Linux (Ubuntu 24.04, arm64, Node 26.13.1, in Docker).
