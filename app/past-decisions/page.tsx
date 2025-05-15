"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, ChevronDown, Clock, Dices, Filter, Search, SlidersHorizontal, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock data for past decisions
const pastDecisions = [
  {
    id: "1",
    title: "Friday Night Movie",
    finalDecision: "The Matrix",
    resolvedDate: "2023-05-10T18:30:00",
    tiebreaker: "Dice Roll",
    participants: 5,
    options: [
      { text: "The Matrix", votes: 2 },
      { text: "Inception", votes: 2 },
      { text: "The Shawshank Redemption", votes: 1 },
    ],
  },
  {
    id: "2",
    title: "Team Lunch Spot",
    finalDecision: "Sushi Palace",
    resolvedDate: "2023-05-08T12:00:00",
    tiebreaker: null,
    participants: 8,
    options: [
      { text: "Sushi Palace", votes: 4 },
      { text: "Burger Joint", votes: 2 },
      { text: "Pizza Place", votes: 1 },
      { text: "Salad Bar", votes: 1 },
    ],
  },
  {
    id: "3",
    title: "Project Name Brainstorm",
    finalDecision: "Phoenix",
    resolvedDate: "2023-05-05T15:45:00",
    tiebreaker: "Spinner",
    participants: 4,
    options: [
      { text: "Phoenix", votes: 1 },
      { text: "Horizon", votes: 1 },
      { text: "Nebula", votes: 1 },
      { text: "Quantum", votes: 1 },
    ],
  },
  {
    id: "4",
    title: "Vacation Destination",
    finalDecision: "Bali",
    resolvedDate: "2023-04-28T09:15:00",
    tiebreaker: "Coin Flip",
    participants: 2,
    options: [
      { text: "Bali", votes: 1 },
      { text: "Paris", votes: 1 },
    ],
  },
  {
    id: "5",
    title: "New Office Location",
    finalDecision: "Downtown",
    resolvedDate: "2023-04-20T14:00:00",
    tiebreaker: null,
    participants: 12,
    options: [
      { text: "Downtown", votes: 7 },
      { text: "Suburb", votes: 3 },
      { text: "Tech District", votes: 2 },
    ],
  },
]

export default function PastDecisionsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedDecision, setExpandedDecision] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const toggleExpand = (id: string) => {
    setExpandedDecision(expandedDecision === id ? null : id)
  }

  const filteredDecisions = pastDecisions.filter(
    (decision) =>
      decision.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      decision.finalDecision.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-white rounded-full p-1.5 shadow-md">
              <Dices className="h-6 w-6 text-purple-600" />
            </div>
            <h1 className="text-xl font-bold text-white">DiceyDecisions</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Past Decisions</h1>
            <p className="text-white/70">View and analyze your previous decision rooms</p>
          </div>
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20"
          >
            Back to Dashboard
          </Button>
        </div>

        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  placeholder="Search decisions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>All Decisions</DropdownMenuItem>
                    <DropdownMenuItem>With Tiebreakers</DropdownMenuItem>
                    <DropdownMenuItem>Last 30 Days</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Newest First</DropdownMenuItem>
                    <DropdownMenuItem>Oldest First</DropdownMenuItem>
                    <DropdownMenuItem>Alphabetical</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex rounded-md overflow-hidden border border-white/20">
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="icon"
                    className={`rounded-none ${viewMode === "table" ? "bg-purple-600" : "bg-white/10 text-white hover:bg-white/20"}`}
                    onClick={() => setViewMode("table")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M3 9h18" />
                      <path d="M3 15h18" />
                      <path d="M9 3v18" />
                      <path d="M15 3v18" />
                    </svg>
                  </Button>
                  <Button
                    variant={viewMode === "cards" ? "default" : "ghost"}
                    size="icon"
                    className={`rounded-none ${viewMode === "cards" ? "bg-purple-600" : "bg-white/10 text-white hover:bg-white/20"}`}
                    onClick={() => setViewMode("cards")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="7" height="7" x="3" y="3" rx="1" />
                      <rect width="7" height="7" x="14" y="3" rx="1" />
                      <rect width="7" height="7" x="14" y="14" rx="1" />
                      <rect width="7" height="7" x="3" y="14" rx="1" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {viewMode === "table" ? (
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-white/5 border-white/20">
                    <TableHead className="text-white">Title</TableHead>
                    <TableHead className="text-white">Final Decision</TableHead>
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">Participants</TableHead>
                    <TableHead className="text-white">Tiebreaker</TableHead>
                    <TableHead className="text-white w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDecisions.map((decision) => (
                    <Collapsible
                      key={decision.id}
                      open={expandedDecision === decision.id}
                      onOpenChange={() => toggleExpand(decision.id)}
                    >
                      <TableRow className="hover:bg-white/5 border-white/20">
                        <TableCell className="font-medium">{decision.title}</TableCell>
                        <TableCell>{decision.finalDecision}</TableCell>
                        <TableCell className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-white/70" />
                          {formatDate(decision.resolvedDate)}
                        </TableCell>
                        <TableCell>{decision.participants}</TableCell>
                        <TableCell>
                          {decision.tiebreaker ? (
                            <Badge className="bg-yellow-500 text-black">{decision.tiebreaker}</Badge>
                          ) : (
                            <span className="text-white/50">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${expandedDecision === decision.id ? "rotate-180" : ""}`}
                              />
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent>
                        <TableRow className="hover:bg-white/5 border-white/20">
                          <TableCell colSpan={6} className="p-0">
                            <div className="bg-white/5 p-4">
                              <h4 className="font-medium mb-2">All Options</h4>
                              <div className="space-y-2">
                                {decision.options.map((option, index) => (
                                  <div key={index} className="flex justify-between items-center p-2 rounded bg-white/5">
                                    <span>{option.text}</span>
                                    <Badge
                                      className={
                                        option.text === decision.finalDecision ? "bg-green-500" : "bg-white/20"
                                      }
                                    >
                                      {option.votes} {option.votes === 1 ? "vote" : "votes"}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDecisions.map((decision) => (
              <Card
                key={decision.id}
                className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{decision.title}</CardTitle>
                    {decision.tiebreaker && (
                      <Badge className="bg-yellow-500 text-black hover:bg-yellow-600">{decision.tiebreaker}</Badge>
                    )}
                  </div>
                  <CardDescription className="text-white/70 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(decision.resolvedDate)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="text-sm text-white/70 mb-1">Final Decision:</div>
                    <div className="text-lg font-bold">{decision.finalDecision}</div>
                  </div>

                  <Collapsible open={expandedDecision === decision.id} onOpenChange={() => toggleExpand(decision.id)}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between text-white/70 hover:bg-white/10"
                      >
                        Show Options
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${expandedDecision === decision.id ? "rotate-180" : ""}`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 space-y-2">
                        {decision.options.map((option, index) => (
                          <div key={index} className="flex justify-between items-center p-2 rounded bg-white/5">
                            <span>{option.text}</span>
                            <Badge className={option.text === decision.finalDecision ? "bg-green-500" : "bg-white/20"}>
                              {option.votes}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex items-center justify-between w-full">
                    <Badge variant="outline" className="border-white/20">
                      {decision.participants} participants
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                      Details
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
