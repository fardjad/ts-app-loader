# TypeScript Service Worker Demo

This example project is a fun experiment to run a TypeScript application (with a
framework like Preact) in the browser with no build step (more accurately, by
compiling TypeScript in the browser). This is probably a terrible idea, but one
can learn a lot from trying things out.

## How It Works

The [loader application](./public/) uses the
[`showDirectoryPicker`](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker)
API to open a directory of TypeScript files directly in the browser. It utilizes
[`typescript-vfs`](https://www.typescriptlang.org/dev/typescript-vfs/) alongside
the TypeScript compiler API to compile the files. The compiled output is then
stored in the browser's
[Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache) and served via a
service worker, which intercepts and handles requests seamlessly.

## Running the Demo Project

Start a local server and open the [loader application](./public/) in a browser,
then open [`./src`](./src/) in the loader application.
