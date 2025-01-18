import * as tsvfs from "@typescript/vfs";
import { Mime } from "mime/lite";
import otherTypes from "mime/types/other.js";
import standardTypes from "mime/types/standard.js";
import ts from "typescript";
import zip from "zip";

const CACHE_NAME = "tsvfs";

const mime = new Mime(standardTypes, otherTypes);
mime.define({ "text/typescript": ["ts"] }, { force: true });

// FIXME: make this configurable
const tsCompilerOptions = {
	esModuleInterop: true,
	skipLibCheck: true,
	target: ts.ScriptTarget.ES2022,
	moduleResolution: ts.ModuleResolutionKind.Bundler,
	allowJs: true,
	resolveJsonModule: true,
	moduleDetection: ts.ModuleDetectionKind.Force,
	isolatedModules: true,
	verbatimModuleSyntax: true,
	module: ts.ModuleKind.ES2022,
	inlineSourceMap: true,
	inlineSources: true,
	lib: ["es2022", "dom", "dom.iterable"],
	jsx: ts.JsxEmit.ReactJSX,
};

const createFsMap = async () => {
	const fsMap = await tsvfs.createDefaultMapFromCDN(
		tsCompilerOptions,
		ts.version,
		true,
		ts,
	);

	const tsLibFixer = {
		get(target, name) {
			let ret = Reflect.get(target, name);
			if (typeof ret === "function") {
				ret = ret.bind(target);
			}
			if (name === "get") {
				const mapGetFn = ret;
				return (key, ...rest) => {
					if (key.endsWith(".d.ts")) {
						const fileContents = mapGetFn(key, ...rest);
						if (fileContents == null) {
							console.warn(`File not found: ${key}`);
							return "";
						}
					}
					return ret(key);
				};
			}
			return ret;
		},

		set(target, name, value) {
			return Reflect.set(target, name, value);
		},
	};

	return new Proxy(fsMap, tsLibFixer);
};

export const loadDirectory = async (dirHandle) => {
	const fsMap = await createFsMap();

	const _loadDirectory = async (dirHandle, path) => {
		for await (const [name, handle] of dirHandle.entries()) {
			const filePath = `${path}/${name}`;

			if (handle.kind === "file") {
				const file = await handle.getFile();
				fsMap.set(filePath, await file.text());
			} else if (handle.kind === "directory") {
				await _loadDirectory(handle, filePath);
			}
		}
	};

	await _loadDirectory(dirHandle, "");

	return fsMap;
};

export async function loadZip(zipFile) {
	const fsMap = await createFsMap();
	const zipReader = new zip.ZipReader(new zip.BlobReader(zipFile));
	const entries = await zipReader.getEntries();
	for (const entry of entries) {
		if (!entry.directory) {
			const text = await entry.getData(new zip.TextWriter());
			const fileNameWithSlash = entry.filename.startsWith("/")
				? entry.filename
				: `/${entry.filename}`;
			fsMap.set(fileNameWithSlash, text);
		}
	}
	await zipReader.close();
	return fsMap;
}

export const buildProject = async (fsMap) => {
	const system = tsvfs.createSystem(fsMap);
	const host = tsvfs.createVirtualCompilerHost(system, tsCompilerOptions, ts);

	const program = ts.createProgram({
		rootNames: [...fsMap.keys()],
		options: tsCompilerOptions,
		host: host.compilerHost,
	});

	program.emit();
	return fsMap;
};

const createResponse = (fileName, contents) => {
	return new Response(contents, {
		headers: { "Content-Type": mime.getType(fileName) },
	});
};

export const populateCache = async (fsMap) => {
	for (const cacheName of await caches.keys()) {
		if (cacheName !== CACHE_NAME) {
			return;
		}

		await caches.delete(cacheName);
	}

	const cache = await caches.open(CACHE_NAME);

	for (const fileName of fsMap.keys()) {
		const contents = fsMap.get(fileName);
		await cache.put(fileName, createResponse(fileName, contents));
		if (fileName === "/index.html") {
			await cache.put("/", createResponse(fileName, contents));
		}
	}
};

export const registerServiceWorker = async (path) => {
	if (!navigator.serviceWorker.controller) {
		const registrations = await navigator.serviceWorker.getRegistrations();
		await Promise.all(registrations.map((r) => r.unregister()));
	}

	await navigator.serviceWorker
		.register(path)
		.then(() => console.log("Service Worker registered!"))
		.catch((error) =>
			console.error("Service Worker registration failed:", error),
		);
};
