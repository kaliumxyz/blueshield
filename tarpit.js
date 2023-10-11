import { createServer } from 'net';

function usage() {
  console.log("Usage: node tarpit.js [options]]");
  console.log("Options:");
  console.log("  -h, --help     show this help message and exit");
  console.log("  -p, --port     port to listen on, give x-y for range, one argument per flag, can be used multiple times");
  console.log("  -v, --version  show program's version number and exit");
  process.exit(0);
}

const ports = [];

function checkPort(port) {
  if (port > 65535 || port < 0 || port != port) {
    console.error("invalid port", port);
    process.exit(1);
  }
}

function parseArgs() {
  // deepcopy
  const argv = process.argv.map((arg) => arg);
  let argIndex = argv.findIndex((arg) => arg.startsWith("-"));
  while (argIndex > 0) {
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
          let param = argv[argIndex];
          if (param.startsWith("-")) {
            // negative
            console.error("invalid port", param);
            process.exit(1);
          } else if (param.includes("-")) {
            // range
            let params = param.split("-");
            if (params.length !== 2) {
              ports.push(
                params.map((p) => parseInt(p, 10))
              )
            }
          } else {
            param = parseInt(param, 10);
            checkPort(param);
            ports.push([param, param]);
          }
          argv.splice(argIndex, 1);
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
  if (argv.length < 2) {
    console.log("invalid arguments");
    usage();
  }
}


function tarpit(port, delay) {
  const server = createServer((socket) => {
    console.log(`Connection from: ${socket.remoteAddress}:${socket.remotePort}`);

    socket.write('Welcome to the tarpit!\n');

    // Delay the response
    setTimeout(() => {
      socket.end();
    }, delay * 1000);
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`Tarpit listening on port ${port}`);
  });

  server.on('error', (err) => {
    console.error(`Error: ${err.message}`);
  });
}

const delay = 5;

parseArgs();

if (ports.length === 0) {
  ports.push([
    1000,
    2000,
  ])
}

for (let i = 0; i < ports.length; i++) {
  const port = ports[i];
  const startPort = port[0];
  const endPort = port[1];

  for (let port = startPort; port < endPort; port++) {
    tarpit(port, delay);
  }
}


process.on('uncaughtException', (err) => {
  console.error(`Uncaught exception: ${err.message}`);
})
