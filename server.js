import { Server } from "net";
import { spawn } from "child_process";

let port = 5050;
let command = "";

function usage() {
  console.log("Usage: node server.js [options] [program] [program-args]");
  console.log("Options:");
  console.log("  -h, --help     show this help message and exit");
  console.log("  -p, --port     port to listen on");
  console.log("  -v, --version  show program's version number and exit");
  process.exit(0);
}

function parseArgs() {
  // deepcopy
  const argv = process.argv.map((arg) => arg);
  let argIndex = argv.findIndex((arg) => arg.startsWith("-"));
  while(argIndex > 0) {
    // console.log("argIndex", argIndex);
    if (argIndex !== -1) {
      const arg = argv[argIndex];
      argv.splice(argIndex, 1);
      switch (arg) {
        case "-h":
        case "--help":
          usage();
          break;
        case "-p":
        case "--port":
          port = +argv[argIndex];
          argv.splice(argIndex, 1);
          if (port > 65535 || port < 0 || port != port) {
            console.error("invalid port", port);
            process.exit(1);
          }
          break;
        case "-v":
        case "--version":
          console.log("v0.0.1");
          process.exit(0);
          break;
        default:
          console.log("invalid option", arg);
          usage();
          break;
      }
      argIndex = argv.findIndex((arg) => arg.startsWith("-"));
    }
  }
  if (argv.length < 3) {
    console.log("invalid arguments");
    usage();
  }
  command = argv[2];

  console.log("port", port);
  console.log("command", command);
}

parseArgs();

const server = new Server();
const sessions = [];

server.on("connection", (socket) => {
  const commands = command.split(" ");
  console.log(`new connection from ${socket.remoteAddress}:${socket.remotePort}`);
  const process = spawn(commands[0], commands.slice(1));
  console.log(`spawned process ${process.pid}`);
  socket.pipe(process.stdin);
  process.stdout.pipe(socket);
  process.stderr.pipe(socket);
  process.stderr.pipe(process.stdout);
  sessions.push({ socket, process });

  socket.on("close", () => {
    const index = sessions.findIndex((s) => s.socket === socket);
    sessions.splice(index, 1);
  });
})

server.on("error", (err) => {
  console.log(err);
});


server.on("close", () => {
  sessions.forEach(({ process }) => process.kill());
});

server.listen(port);
