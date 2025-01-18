# TypeScript WebApp Loader

This is a fun experiment to run a TypeScript application (with a framework like
Preact) in the browser with no build step (more accurately, by compiling
TypeScript in the browser). This is probably a terrible idea, but one can learn
a lot from trying things out.

## How It Works

The [loader application](./public/) uses the
[`showDirectoryPicker`](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker)
API to open the project directory or, if unsupported, falls back to loading a
zip file directly in the browser. It utilizes
[`typescript-vfs`](https://www.typescriptlang.org/dev/typescript-vfs/) alongside
the TypeScript compiler API to compile the files. The compiled output is then
stored in the browser's
[Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache) and served via a
service worker, which intercepts and handles requests seamlessly.

## Running the Example Project

Visit [ts-app-loader.fardjad.com](https://ts-app-loader.fardjad.com) and open
[`example-apps/preact`](./example-apps/preact/) in the loader application. For
browsers that don't support the `showDirectoryPicker` API, you can zip the
contents of the directory and open the zip file in the loader application.
