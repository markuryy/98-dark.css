import { startDevServer } from '@web/dev-server';
import chokidar from 'chokidar';
import build from "./build.js";

chokidar
  .watch(["style.css", "build.js", "docs", "fonts", "icon"], {
    usePolling: true,
  })
  .on("change", (file) => {
    console.log(
      `[${new Date().toLocaleTimeString()}] ${file} changed -- rebuilding...`
    );
    build();
  });

async function main() {
  const server = await startDevServer({
    config: {
      rootDir: './dist',
      watch: true
    }
  });
}

main();
