
import { NextResponse } from "next/server"
import { google } from "googleapis"

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

const jwt = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  undefined,
  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  SCOPES
)

const sheets = google.sheets({ version: "v4", auth: jwt })


const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!

const TAB = "'Лист1'"


export async function GET() {
  try {
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TAB}!A:F`,    
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
      range:         `${TAB}!A:F`,  
      valueInputOption: "RAW",
      requestBody:   { values },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Sheets POST error:", err)
    return NextResponse.error()
  }
}
