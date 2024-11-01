import swc from "unplugin-swc";
import {defineConfig} from "vitest/config";

function resolveWorkspaceFiles() {
  return {
    name: "resolve-workspace-files",
    resolveId(id: string) {
      if (id.includes("@project")) {
        return id.replace(".js", ".ts")
      }
    }
  }
}

export default defineConfig({
  test: {
    globals: true,
    root: "./"
  },
  plugins: [
    resolveWorkspaceFiles(),

    // This is required to build the test files with SWC
    swc.vite({
      //tsconfigFile: "./tsconfig.spec.json",
      // Explicitly set the module type to avoid inheriting this value from a `.swcrc` config file
      module: {type: "es6"},
      jsc: {
        transform: {
          useDefineForClassFields: false
        }
      }
    })
  ]
});
