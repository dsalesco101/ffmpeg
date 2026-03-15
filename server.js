import express from "express";
import fetch from "node-fetch";
import { exec } from "child_process";
import fs from "fs";

const app = express();
app.use(express.json());

app.post("/stitch", async (req, res) => {
  const clips = req.body.clips;

  if (!clips || clips.length === 0) {
    return res.status(400).json({ error: "No clips provided" });
  }

  // Download clips
  const files = [];
  for (let i = 0; i < clips.length; i++) {
    const url = clips[i];
    const file = `clip${i}.mp4`;
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(file, Buffer.from(buffer));
    files.push(file);
  }

  // Create concat list
  const list = files.map(f => `file '${f}'`).join("\n");
  fs.writeFileSync("list.txt", list);

  // Stitch using FFmpeg
  exec("ffmpeg -f concat -safe 0 -i list.txt -c copy output.mp4", (err) => {
    if (err) return res.status(500).json({ error: "FFmpeg failed" });

    const video = fs.readFileSync("output.mp4");
    res.setHeader("Content-Type", "video/mp4");
    res.send(video);
  });
});

app.listen(3000, () => console.log("API running on port 3000"));
