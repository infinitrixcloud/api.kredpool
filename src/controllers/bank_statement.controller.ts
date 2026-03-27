import { Request, Response } from "express";
import sharp from "sharp";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

// ==================== HELPERS ====================

// Fix OCR date
function fixDate(text: string): string {
  const match = text.match(/^(\d{2,4})[-/.](\d{2})[-/.](\d{4})$/);

  if (match) {
    let dayPart = match[1];

    // 🔥 Remove serial number (take last 2 digits only)
    if (dayPart.length > 2) {
      dayPart = dayPart.slice(-2);
    }

    return `${dayPart.padStart(2, "0")}-${match[2]}-${match[3]}`;
  }

  return text;
}

// Improved balance parser
function parseBalance(text: string): number | null {
  const match = text.match(/([\d,]+\.\d{1,2})\s*Cr/i);
  return match ? parseFloat(match[1].replace(/,/g, "")) : null;
}

// Flexible date validation
function isValidDate(text: string): boolean {
  const fixed = fixDate(text);

  const match = fixed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return false;

  const day = parseInt(match[1]);
  const month = parseInt(match[2]);

  return day >= 1 && day <= 31 && month >= 1 && month <= 12;
}

function isBalance(text: string): boolean {
  return /[\d,]+\.\d{1,2}\s*Cr/i.test(text);
}

// ==================== PARSER ====================

function parseBankStatement(lines: string[]) {
  const cleaned = lines
    .map((l) => l.trim())
    .filter((l) => l.length > 2);

  // HEADER
  const bank_name =
  cleaned.find(t =>
    /union\s*bank/i.test(t.replace(/[^a-zA-Z\s]/g, ""))
  )?.replace(/^[^A-Za-z]*/, "") || "";

let account_holder_name = "";

// 🔥 find index of Name label
const nameIndex = cleaned.findIndex(t =>
  t.toLowerCase().includes("name")
);

if (nameIndex !== -1) {
  for (let i = nameIndex + 1; i < nameIndex + 6 && i < cleaned.length; i++) {
    const t = cleaned[i];

    const isName = /^[A-Z\s]{5,}$/.test(t);

    const isInvalid =
      /BRANCH|BANK|STATEMENT|DETAILS|ACCOUNT|KAVATHE|SANGLI|MAHARASHTRA|INDIA/i.test(t);

    if (isName && !isInvalid) {
      account_holder_name = t;
      break;
    }
  }
}

  const accIdx = cleaned.findIndex((l) => l === "Account Number:");
  const account_number =
    accIdx !== -1
      ? cleaned[accIdx + 1]
      : cleaned.find((l) => /^\d{10,}$/.test(l)) || "";

  const ifsc =
    cleaned.find((l) => /^UBIN\d+/.test(l)) || "";

  const phone =
    cleaned.find((l) => l.startsWith("Phone"))?.replace("Phone", "") || "";

  const generated_date =
    cleaned.find((l) => l.startsWith("Generated Date"))?.replace("Generated Date", "") || "";

  // FIND START
  const startIdx = cleaned.findIndex((l) => l === "Opening Balance");

  let initial_balance = null;
  let start = startIdx + 1;

  for (let i = startIdx + 1; i < startIdx + 5; i++) {
    const bal = parseBalance(cleaned[i]);
    if (bal !== null) {
      initial_balance = bal;
      start = i + 1;
      break;
    }
  }

  const transactions: any[] = [];
  let current: any = null;
  let desc: string[] = [];
  let prevBalance = initial_balance;

  for (let i = start; i < cleaned.length; i++) {
    const line = cleaned[i];

    const balance = parseBalance(line);

    // 🔥 FOUND BALANCE → COMPLETE TRANSACTION
    if (balance !== null) {
      if (current && current.date) {
        current.description = desc.join(" ").trim();
        current.balance = balance;

        // calculate debit/credit
        if (prevBalance !== null) {
          const diff = +(balance - prevBalance).toFixed(2);
          if (diff < 0) current.debit = Math.abs(diff);
          else if (diff > 0) current.credit = diff;
        }

        prevBalance = balance;
        transactions.push(current);
      }

      // start new transaction
      current = {
        date: null,
        description: "",
        balance: null,
        debit: null,
        credit: null,
      };
      desc = [];

      continue;
    }

    // 🔥 DATE
    if (isValidDate(line)) {
      if (!current) {
        current = {
          date: fixDate(line),
          description: "",
          balance: null,
          debit: null,
          credit: null,
        };
      } else {
        current.date = fixDate(line);
      }
      continue;
    }

    // 🔥 DESCRIPTION
    if (!isBalance(line)) {
      desc.push(line);
    }
  }

  // 🔥 push last transaction
  if (current && current.date) {
    current.description = desc.join(" ").trim();
    transactions.push(current);
  }

  return {
    bank_name,
    account_holder_name,
    account_number,
    ifsc,
    phone,
    generated_date,
    initial_balance,
    transactions
  };
}

// ==================== OCR ====================

async function preprocess(input: string, output: string) {
  await sharp(input)
    .resize({ width: 1200 })
    .grayscale()
    .normalize()
    .sharpen()
    .toFile(output);
}

// ==================== CONTROLLER ====================

export const bankStatementOCrController = async (
  req: Request,
  res: Response
) => {
  try {
    const files =
      (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);

    if (!files.length) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    let allText: string[] = [];

    for (const file of files) {
      const output = `processed-${Date.now()}.jpg`;

      await preprocess(file.path, output);

      const form = new FormData();
      form.append("file", fs.createReadStream(output));

      const response = await axios.post("http://127.0.0.1:8000/ocr", form, {
        headers: form.getHeaders(),
      });

      const ocrRaw = response.data?.result || response.data;

      ocrRaw.forEach((block: any) => {
        block.forEach((line: any) => {
          if (Array.isArray(line) && line[1]?.[0]) {
            allText.push(line[1][0]);
          }
        });
      });

      await fs.promises.unlink(file.path).catch(() => {});
      await fs.promises.unlink(output).catch(() => {});
    }

    const cleaned = [...new Set(allText)];

    const parsed = parseBankStatement(cleaned);

    res.json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OCR failed" });
  }
};