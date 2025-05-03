import express from "express";
import ingestRouter from "./routes/ingest";
import reportRouter from "./routes/report";
import * as fs from "fs";
import * as path from "path";
import { validateAccount } from "./services/validationWorker";
import csv from "csv-parser";
import pLimit from "p-limit";

const app = express();
const port = 4000;

const main = async () => {
  const filePath = path.join(__dirname, "data.csv");

  // Read the CSV file
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading CSV file:", err);
      return;
    }

    // Split CSV into rows
    const rows = data.trim().split("\n");

    const parsed = rows.map((row) => row.split(","));

    //console.log("Parsed CSV:");
    parsed.forEach((row) => {
      validateAccount(row[0], row[1]);
      console.log(row[0], row[1]);
    });
  });
};

//main();

app.get("/read-csv", async (req, res) => {
    const filePath = path.join(__dirname, "data.csv");
    const results: any[] = [];
    const limit = pLimit(10); // Adjust concurrency limit
  
    const tasks: Promise<any>[] = [];
  
    try {
      const stream = fs.createReadStream(filePath).pipe(csv(["accountNumber", "bankCode"]));
  
      stream.on("data", (row:any) => {
        const { accountNumber, bankCode } = row;
  
        const task = limit(() => validateAccount(accountNumber, bankCode));
        tasks.push(task);
      });
  
      stream.on("end", async () => {
        try {
          const account_status = await Promise.all(tasks);
          res.json({ account_status });
        } catch (err) {
          console.error("Error during validation:", err);
          res.status(500).send("Validation error");
        }
      });
  
      stream.on("error", (err:any) => {
        console.error("Error reading CSV stream:", err);
        res.status(500).send("Failed to process CSV");
      });
    } catch (err) {
      console.error("Unexpected error:", err);
      res.status(500).send("Unexpected server error");
    }
  });

app.use(express.json());
//app.use('/ingest', ingestRouter);
app.use("/report", reportRouter);

app.post("/ingest", (req, res) => {
  console.log(req);
});

app.listen(port, () => console.log(`Server running on port ${port}`));
