// Путь: src/app/api/sheets/route.ts

import { NextResponse } from "next/server"
import { google } from "googleapis"

// 1) Область доступа
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

// 2) JWT-клиент
const jwt = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  undefined,
  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  SCOPES
)

// 3) Инициализируем Sheets API
const sheets = google.sheets({ version: "v4", auth: jwt })

// 4) ID таблицы из .env.local
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!

// 5) Имя листа (обёрнуто в кавычки для надёжности)
const TAB = "'Лист1'"

// --- GET: читаем все строки A–F ---
export async function GET() {
  try {
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TAB}!A:F`,    // читаем все строки столбцов A–F
    })

    const rows = resp.data.values || []
    const transactions = rows.map((row) => ({
      id:       row[0],
      date:     row[1],
      name:     row[2],
      type:     row[3] as "income" | "expense",
      category: row[4],
      amount:   parseFloat(row[5]),
    }))

    return NextResponse.json({ transactions })
  } catch (err) {
    console.error("Sheets GET error:", err)
    return NextResponse.error()
  }
}

// --- POST: добавляем новую запись ---
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      id: string
      date: string
      name: string
      type: "income" | "expense"
      category: string
      amount: number
    }

    const values = [[
      body.id,
      body.date,
      body.name,
      body.type,
      body.category,
      body.amount.toString(),
    ]]

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range:         `${TAB}!A:F`,  // добавляем в столбцы A–F
      valueInputOption: "RAW",
      requestBody:   { values },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Sheets POST error:", err)
    return NextResponse.error()
  }
}
