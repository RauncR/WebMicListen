const http = require("http"); //Import http for server creation
const fs = require("fs"); //Import fs for filesystem - stream
const path = require("path"); //Import path for easier file path management
const { Server } = require("socket.io"); //Import socket server
const bcrypt = require("bcrypt"); // Import bcrypt for password encryption
require("dotenv").config(); //Import dotenv for safe password storage file

const hashedPassword = process.env.PASSWORD_HASH;

const PORT = 8082;

const RECORDING_PATH = path.join(__dirname, "recording.wav"); //Establish directory for recorded file
console.log(RECORDING_PATH);

//AUTHENTIFICATION
const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/auth") {
    //If request method is POST and tries to access path /auth...
    // Collect JSON body
    let body = ""; //...then listen to incoming data events from request body...
    req.on("data", (chunk) => (body += chunk)); //...and collect it...
    req.on("end", async () => {
      //...If data from request body runs out...
      try {
        const data = JSON.parse(body); //Convert raw JSON into JavaScript object named data
        const ok = await bcrypt.compare(data.password, hashedPassword); //we access the data object's property named password...
        //...and compare it with hashed password stored in the .env
        if (ok) {
          res.writeHead(200, { "Content-Type": "application/json" }); //If they are identical we build response head as JSON...
          res.end(JSON.stringify({ success: true })); //...And convert it back to raw JSON formatted string...
        } else {
          res.writeHead(401);
          res.end(JSON.stringify({ success: false, message: "Unauthorized" })); //JavaScirpt object to raw JSON
        }
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, message: "Bad Request" }));
      }
    });
    return;
  }

  if (req.method === "GET" && req.url === "/download") {
    if (!fs.existsSync(RECORDING_PATH)) {
      //If not fs.appendFile does it
      res.writeHead(404);
      return res.end("No recording yet");
    }

    // Read raw data and wrap in a WAV header for easier playback
    const data = fs.readFileSync(RECORDING_PATH); //Reads the raw PCM bytes from disk into memory.
    const wavHeader = makeWavHeader(data.length);
    const fullFile = Buffer.concat([wavHeader, data]); //Concatenates the 44-byte header + all PCM data into a single binary object.

    res.writeHead(200, {
      "Content-Type": "audio/wav",
      "Content-Disposition": "attachment; filename=recording.wav",
    });
    res.end(fullFile);
    return;
  }

  // Serve static files (login.html first)
  const filePath = path.join(
    __dirname,
    "public",
    req.url === "/" ? "login.html" : req.url,
  );
  const ext = path.extname(filePath); //Extract file extension
  const mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end("404 Not Found");
    } else {
      res.writeHead(200, { "Content-Type": mimeTypes[ext] || "text/plain" });
      res.end(content);
    }
  });
});

const io = new Server(server);

io.on("connection", (socket) => {
  console.log("A user connected");
  let writeStream = null;
  let dataLength = 0;

  socket.on("start-saving", () => {
    //Listening to start-saving custom event
    if (!writeStream) {
      //If there is no writeStream....
      writeStream = fs.createWriteStream(RECORDING_PATH, { flags: "w" }); // Initialize a stream to the directory
      const header = makeWavHeader(0); //Create a wave header...
      writeStream.write(header); //...And write it to the stream
      dataLength = 0;
    }
  });

  socket.on("stop-saving", () => {
    if (writeStream) {
      writeStream.end();

      const fd = fs.openSync(RECORDING_PATH, "r+");
      const header = makeWavHeader(datalength);
      fs.writeFileSync(fd, header, 0, 44, 0);
      fs.closeSync(fd);

      writeStream = null;
    }
  });

  socket.on("audio-chunk", (chunk) => {
    socket.broadcast.emit("audio-chunk", chunk);
    if (writeStream) {
      const buf = Buffer.from(chunk);
      dataLength += buf.length;
      writeStream.write(buf);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

function makeWavHeader(dataLength, sampleRate = 44100, numChannels = 1) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(dataLength + 36, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * 2, 28);
  header.writeUInt16LE(numChannels * 2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
