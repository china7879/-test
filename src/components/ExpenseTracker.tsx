"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"


export type Transaction = {
  id: string
  date: string
  name: string
  type: "income" | "expense"
  category: string
  amount: number
}

export default function ExpenseTracker() {
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const [newTransaction, setNewTransaction] = useState<
    Omit<Transaction, "id" | "date">
  >({
    name: "",
    type: "expense",
    category: "General",
    amount: 0,
  })
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

 
  const categories = ["General", "Food", "Transport", "Taxes", "Others"]


  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/sheets", { cache: "no-store" })
        if (!res.ok) throw new Error("Ошибка загрузки")
        const json = await res.json()
        setTransactions(json.transactions)
      } catch (err) {
        console.error("Fetch error:", err)
      }
    }
    fetchData()
  }, [])

  const handleAddTransaction = async () => {
    if (!newTransaction.name || newTransaction.amount <= 0) return

    const transaction: Transaction = {
      ...newTransaction,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    }
    setTransactions([...transactions, transaction])

    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      })
      if (!res.ok) throw new Error("Ошибка сохранения")
    } catch (err) {
      console.error("Save error:", err)
    }

    setNewTransaction({ name: "", type: "expense", category: "General", amount: 0 })
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditTransaction(transaction)
    setIsEditDialogOpen(true)
  }
  const handleUpdateTransaction = () => {
    if (!editTransaction) return
    setTransactions(transactions.map(t =>
      t.id === editTransaction.id ? editTransaction : t
    ))
    setIsEditDialogOpen(false)
    setEditTransaction(null)
  }

  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id))
  }

  const totalBalance = transactions.reduce(
    (acc, t) => (t.type === "income" ? acc + t.amount : acc - t.amount),
    0
  )

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Expense & Income Tracker
      </h1>

      <div className="grid gap-8 md:grid-cols-[1fr_1.5fr]">
        <Card>
          <CardHeader>
            <CardTitle>Add Transaction</CardTitle>
            <CardDescription>Enter the details of your transaction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Transaction Name</Label>
              <Input
                id="name"
                placeholder="e.g., Grocery Shopping"
                value={newTransaction.name}
                onChange={e =>
                  setNewTransaction({ ...newTransaction, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Transaction Type</Label>
              <RadioGroup
                value={newTransaction.type}
                onValueChange={value =>
                  setNewTransaction({
                    ...newTransaction,
                    type: value as "income" | "expense",
                  })
                }
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="expense" />
                  <Label htmlFor="expense">Expense</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="income" />
                  <Label htmlFor="income">Income</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newTransaction.category}
                onValueChange={value =>
                  setNewTransaction({ ...newTransaction, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={newTransaction.amount || ""}
                onChange={e =>
                  setNewTransaction({
                    ...newTransaction,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            {/* Кнопка */}
            <Button
              className="w-full mt-4"
              onClick={handleAddTransaction}
              disabled={!newTransaction.name || newTransaction.amount <= 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Your recent transactions</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Balance</div>
              <div
                className={`text-xl font-bold ${
                  totalBalance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                ${totalBalance.toFixed(2)}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions yet. Add your first transaction!
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {transactions.map(tx => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{tx.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {tx.category}
                        </div>
                        <Badge
                          variant={tx.type === "income" ? "outline" : "secondary"}
                        >
                          {tx.type}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`font-bold ${
                            tx.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {tx.type === "income" ? "+" : "-"}$
                          {tx.amount.toFixed(2)}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditTransaction(tx)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTransaction(tx.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Make changes to your transaction here.
            </DialogDescription>
          </DialogHeader>

          {editTransaction && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Transaction Name</Label>
                <Input
                  id="edit-name"
                  value={editTransaction.name}
                  onChange={e =>
                    setEditTransaction({ ...editTransaction, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Transaction Type</Label>
                <RadioGroup
                  value={editTransaction.type}
                  onValueChange={value =>
                    setEditTransaction({
                      ...editTransaction,
                      type: value as "income" | "expense",
                    })
                  }
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="expense" id="edit-expense" />
                    <Label htmlFor="edit-expense">Expense</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="income" id="edit-income" />
                    <Label htmlFor="edit-income">Income</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editTransaction.category}
                  onValueChange={value =>
                    setEditTransaction({ ...editTransaction, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editTransaction.amount || ""}
                  onChange={e =>
                    setEditTransaction({
                      ...editTransaction,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTransaction}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
