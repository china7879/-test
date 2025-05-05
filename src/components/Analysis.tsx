// src/app/analysis/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import type { Metadata } from "next";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const metadata: Metadata = {
  title: "Financial Dashboard",
  description: "Interactive financial dashboard showing income and expenses",
};

type TimePeriod = "daily" | "weekly" | "monthly" | "yearly";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category:
    | "food"
    | "transport"
    | "taxes"
    | "others"
    | "salary"
    | "investment"
    | "freelance";
}

export function aggregateDataByPeriod(data: Transaction[], period: TimePeriod) {
  const groupedData = new Map<string, { income: number; expenses: number }>();
  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryTotals = { food: 0, transport: 0, taxes: 0, others: 0 };
  data.forEach((tx) => {
    const date = new Date(tx.date);
    let key: string;
    switch (period) {
      case "daily":
        key = date.toISOString().split("T")[0];
        break;
      case "weekly": {
        const first = new Date(date.getFullYear(), 0, 1);
        const pastDays = (date.getTime() - first.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDays + first.getDay() + 1) / 7);
        key = `Week ${weekNum}, ${date.getFullYear()}`;
        break;
      }
      case "monthly":
        key = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;
        break;
      case "yearly":
        key = date.getFullYear().toString();
        break;
      default:
        key = "";
    }
    if (!groupedData.has(key)) groupedData.set(key, { income: 0, expenses: 0 });
    const grp = groupedData.get(key)!;
    if (tx.type === "income") {
      grp.income += tx.amount;
      totalIncome += tx.amount;
    } else {
      grp.expenses += tx.amount;
      totalExpenses += tx.amount;
      if (tx.category === "food") categoryTotals.food += tx.amount;
      else if (tx.category === "transport") categoryTotals.transport += tx.amount;
      else if (tx.category === "taxes") categoryTotals.taxes += tx.amount;
      else if (tx.category === "others") categoryTotals.others += tx.amount;
    }
  });
  const periods = Array.from(groupedData.entries()).map(([name, vals]) => ({ name, ...vals }));
  const limited = period === "yearly" ? periods : periods.slice(0, 10).reverse();
  return {
    aggregatedData: limited,
    totalIncome,
    totalExpenses,
    categoryTotals,
  };
}

interface CategoryBreakdownChartProps {
  data: { food: number; transport: number; taxes: number; others: number };
}

function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  const chartData = [
    { name: "Food", value: data.food },
    { name: "Transport", value: data.transport },
    { name: "Taxes", value: data.taxes },
    { name: "Others", value: data.others },
  ];
  return (
    <ChartContainer
      config={{
        food: { label: "Food", color: "hsl(var(--chart-1))" },
        transport: { label: "Transport", color: "hsl(var(--chart-2))" },
        taxes: { label: "Taxes", color: "hsl(var(--chart-3))" },
        others: { label: "Others", color: "hsl(var(--chart-4))" },
      }}
      className="h-full w-full"
    >
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {chartData.map((_, i) => {
            const keys = ["food", "transport", "taxes", "others"] as const;
            return <Cell key={i} fill={`var(--color-${keys[i]})`} />;
          })}
        </Pie>
        <ChartTooltip
          formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Legend verticalAlign="bottom" height={40} />
      </PieChart>
    </ChartContainer>
  );
}

interface IncomeExpensesChartProps {
  data: Array<{ name: string; income: number; expenses: number }>;
}

function IncomeExpensesChart({ data }: IncomeExpensesChartProps) {
  return (
    <ChartContainer
      config={{
        income: { label: "Income", color: "hsl(var(--chart-1))" },
        expenses: { label: "Expenses", color: "hsl(var(--chart-2))" },
      }}
      className="h-full w-full"
    >
      <BarChart data={data} margin={{ top: 16, right: 16, left: 24, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} angle={-45} textAnchor="end" />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => `$${v}`} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="line"
              formatter={(value) =>
                Array.isArray(value)
                  ? value.map((v) => (typeof v === "number" ? `$${v.toLocaleString()}` : v))
                  : value
              }
            />
          }
        />
        <Legend verticalAlign="top" height={40} />
        <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export default function Analysis() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("monthly");
  const [rawData, setRawData] = useState<Transaction[]>([]);

  interface ApiTransaction {
    id: string;
    date: string;
    name: string;
    amount: number;
    type: "income" | "expense";
    category: Transaction["category"];
  }

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/sheets");
      const { transactions } = await res.json();
      const mapped = transactions.map((t: ApiTransaction) => ({
        id: t.id,
        date: t.date,
        description: t.name,
        amount: t.amount,
        type: t.type,
        category: t.category,
      }));
      setRawData(mapped);
    }
    load();
  }, []);

  const { aggregatedData, totalIncome, totalExpenses, categoryTotals } =
    aggregateDataByPeriod(rawData, timePeriod);

  const balance = totalIncome - totalExpenses;
  const balanceChange = balance >= 0 ? "+2.5%" : "-4.3%";
  const balanceIcon =
    balance >= 0 ? <ArrowUpIcon className="h-4 w-4 text-green-500" /> : <ArrowDownIcon className="h-4 w-4 text-red-500" />;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span>{timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTimePeriod("daily")}>Daily</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimePeriod("weekly")}>Weekly</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimePeriod("monthly")}>Monthly</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimePeriod("yearly")}>Yearly</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <ArrowUpIcon className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalIncome.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+5.1% from previous {timePeriod.slice(0, -2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <ArrowDownIcon className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+2.5% from previous {timePeriod.slice(0, -2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              {balanceIcon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${balance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{balanceChange} from previous {timePeriod.slice(0, -2)}</p>
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Income vs Expenses</CardTitle>
                <CardDescription>Financial overview for the selected {timePeriod} period</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <IncomeExpensesChart data={aggregatedData} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
                <CardDescription>Breakdown of expenses by category</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <CategoryBreakdownChart data={categoryTotals} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
