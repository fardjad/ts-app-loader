import ts from "typescript";
import * as tsvfs from "@typescript/vfs";
import { Mime } from "mime/lite";
import standardTypes from "mime/types/standard.js";
import otherTypes from "mime/types/other.js";

const mime = new Mime(standardTypes, otherTypes);
mime.define({ "text/typescript": ["ts"] }, { force: true });

const compilerOptions = {
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

let fsMap = await tsvfs.createDefaultMapFromCDN(
	compilerOptions,
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

fsMap = new Proxy(fsMap, tsLibFixer);

const readDirectoryRecursively = async (dirHandle, path) => {
	for await (const [name, handle] of dirHandle.entries()) {
		if (handle.kind === "file") {
			const file = await handle.getFile();
			fsMap.set(`${path}/${name}`, await file.text());
		} else if (handle.kind === "directory") {
			await readDirectoryRecursively(handle, `${path}/${name}`);
		}
	}

	const system = tsvfs.createSystem(fsMap);
	const host = tsvfs.createVirtualCompilerHost(system, compilerOptions, ts);

	const program = ts.createProgram({
		rootNames: [...fsMap.keys()],
		options: compilerOptions,
		host: host.compilerHost,
	});

	program.emit();

	for (const cacheName of await caches.keys()) {
		if (cacheName !== "tsvfs") {
			return;
		}

		await caches.delete(cacheName);
	}

	const cache = await caches.open("tsvfs");

	for (const fileName of fsMap.keys()) {
		const contents = fsMap.get(fileName);
		const response = new Response(contents, {
			headers: { "Content-Type": mime.getType(fileName) },
		});
		await cache.put(fileName, response);
	}
};

export const accessDirectory = async () => {
	try {
		const dirHandle = await window.showDirectoryPicker();
		await readDirectoryRecursively(dirHandle, "");
	} catch (err) {
		console.error("Error accessing directory:", err);
	}
};
