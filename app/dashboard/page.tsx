"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Calendar, Clock, Dices, LogOut, Plus, Share2, Sparkles, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getUserDecisionRooms, joinRoomByCode } from "../actions/rooms"
import { logout } from "../actions/auth"
import type { Room } from "@/lib/models"

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [joinCode, setJoinCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [pastDecisions, setPastDecisions] = useState<Room[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)

  useEffect(() => {
    async function loadRooms() {
      try {
        const result = await getUserDecisionRooms()
        if (result.success) {
          setPastDecisions(result.rooms || [])
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to load rooms",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load rooms",
          variant: "destructive",
        })
      } finally {
        setIsLoadingRooms(false)
      }
    }

    loadRooms()
  }, [toast])

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "Room code required",
        description: "Please enter a valid room code",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await joinRoomByCode(joinCode.trim())

      if (result.success) {
        toast({
          title: "Joining room...",
          description: `Connecting to room with code: ${result.roomCode}`,
        })
        router.push(`/room/${result.roomCode}`)
      } else {
        toast({
          title: "Failed to join room",
          description: result.message || "Please check the room code and try again",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join room",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

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
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Your Decision Rooms</h2>
              <div className="flex gap-2">
                <Button asChild className="bg-green-500 hover:bg-green-600">
                  <Link href="/create-room">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Room
                  </Link>
                </Button>
                <Button asChild variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                  <Link href="/join-room">
                    <Share2 className="h-4 w-4 mr-2" />
                    Join Room
                  </Link>
                </Button>
              </div>
            </div>

            {isLoadingRooms ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="bg-white/10 backdrop-blur-md border-white/20 text-white">
                    <CardHeader className="pb-2">
                      <div className="h-6 w-3/4 bg-white/20 rounded animate-pulse mb-2"></div>
                      <div className="h-4 w-1/2 bg-white/20 rounded animate-pulse"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-5 w-full bg-white/20 rounded animate-pulse mb-2"></div>
                      <div className="h-5 w-3/4 bg-white/20 rounded animate-pulse"></div>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-between">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((j) => (
                          <div key={j} className="h-8 w-8 rounded-full bg-white/20 animate-pulse"></div>
                        ))}
                      </div>
                      <div className="h-8 w-24 bg-white/20 rounded animate-pulse"></div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : pastDecisions.length === 0 ? (
              <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <div className="bg-white/10 rounded-full p-4 mb-4">
                    <Sparkles className="h-8 w-8 text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No Decisions Yet</h3>
                  <p className="text-white/70 text-center mb-4">
                    You haven't created or joined any decision rooms yet. Create your first room to get started!
                  </p>
                  <Button asChild className="bg-green-500 hover:bg-green-600">
                    <Link href="/create-room">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Room
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastDecisions.map((decision) => (
                  <Card
                    key={decision._id?.toString()}
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
                        {decision.resolvedAt ? formatDate(decision.resolvedAt.toString()) : "In progress"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-yellow-400" />
                        <span className="font-medium">
                          {decision.status === "completed" ? "Final Decision:" : "Status:"}
                        </span>
                      </div>
                      <p className="text-lg font-bold pl-6">
                        {decision.finalDecision ||
                          (decision.status === "lobby"
                            ? "Waiting for options"
                            : decision.status === "voting"
                              ? "Voting in progress"
                              : "Pending")}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-between">
                      <div className="flex -space-x-2">
                        {/* We don't have participant count here, so we'll just show a placeholder */}
                        <Avatar className="border-2 border-purple-500 h-8 w-8">
                          <AvatarFallback className="bg-purple-700 text-white text-xs">U</AvatarFallback>
                        </Avatar>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                        onClick={() => router.push(`/room/${decision.code}`)}
                      >
                        {decision.status === "completed" ? "View Details" : "Enter Room"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardHeader>
                <CardTitle>Quick Join</CardTitle>
                <CardDescription className="text-white/70">Enter a room code to join instantly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter room code"
                    className="flex h-10 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <Button onClick={handleJoinRoom} className="bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                    {isLoading ? "Joining..." : "Join"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardHeader>
                <CardTitle>Upcoming Activity</CardTitle>
                <CardDescription className="text-white/70">Your scheduled decision rooms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pastDecisions.filter((room) => room.status !== "completed").length > 0 ? (
                    pastDecisions
                      .filter((room) => room.status !== "completed")
                      .slice(0, 2)
                      .map((room) => (
                        <div
                          key={room._id?.toString()}
                          className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                          onClick={() => router.push(`/room/${room.code}`)}
                        >
                          <Calendar className="h-10 w-10 text-pink-400 bg-pink-400/20 p-2 rounded-lg" />
                          <div>
                            <h4 className="font-medium">{room.title}</h4>
                            <p className="text-sm text-white/70">
                              {room.status === "lobby" ? "Waiting for options" : "Voting in progress"}
                            </p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center p-4 text-white/60">
                      <p>No active decision rooms</p>
                      <p className="text-sm">Create a new room to get started!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
