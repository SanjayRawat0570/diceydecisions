"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, Dices, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { getRoomDetails, submitVote } from "../../../actions/rooms"
import { logout } from "../../../actions/auth"
import type { Option, Participant } from "@/lib/models"

export default function VotingPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [options, setOptions] = useState<Option[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [votingProgress, setVotingProgress] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isLoadingRoom, setIsLoadingRoom] = useState(true)
  const [currentUserId, setCurrentUserId] = useState("")
  const [isCreator, setIsCreator] = useState(false)
  const [roomTitle, setRoomTitle] = useState("")
  const roomCode = params.id.toUpperCase()

  // Load room details
  useEffect(() => {
    async function loadRoomDetails() {
      try {
        const result = await getRoomDetails(roomCode)

        if (result.success) {
          // Shuffle options
          const shuffledOptions = [...result.options].sort(() => Math.random() - 0.5)
          setOptions(shuffledOptions || [])
          setParticipants(result.participants || [])
          setRoomTitle(result.room?.title || "")
          setIsCreator(result.isCreator || false)
          setCurrentUserId(result.currentUserId || "")

          // Check if user has already voted
          const currentParticipant = result.participants.find((p) => p.userId.toString() === result.currentUserId)
          if (currentParticipant?.hasVoted) {
            setHasVoted(true)
          }

          // If room is in lobby state, redirect to lobby
          if (result.room?.status === "lobby") {
            router.push(`/room/${roomCode}`)
          } else if (result.room?.status === "completed") {
            router.push(`/room/${roomCode}/results`)
          }
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to load room details",
            variant: "destructive",
          })
          router.push("/dashboard")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load room details",
          variant: "destructive",
        })
        router.push("/dashboard")
      } finally {
        setIsLoadingRoom(false)
      }
    }

    loadRoomDetails()

    // Set up polling for room updates
    const interval = setInterval(async () => {
      try {
        const result = await getRoomDetails(roomCode)

        if (result.success) {
          setParticipants(result.participants || [])

          // If room is completed, redirect to results
          if (result.room?.status === "completed") {
            router.push(`/room/${roomCode}/results`)
          }
        }
      } catch (error) {
        console.error("Error polling room details:", error)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [roomCode, router, toast])

  // Update voting progress
  useEffect(() => {
    const votedCount = participants.filter((p) => p.hasVoted).length
    const progress = Math.round((votedCount / participants.length) * 100)
    setVotingProgress(progress)

    // If everyone has voted, redirect to results after a delay
    if (progress === 100 && isCreator) {
      toast({
        title: "All votes are in!",
        description: "Redirecting to results...",
      })

      setTimeout(() => {
        router.push(`/room/${roomCode}/results`)
      }, 2000)
    }
  }, [participants, roomCode, router, toast, isCreator])

  // Countdown timer
  useEffect(() => {
    if (!hasVoted && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !hasVoted) {
      toast({
        title: "Time's up!",
        description: "You didn't vote in time.",
        variant: "destructive",
      })
      setHasVoted(true)
    }
  }, [timeLeft, hasVoted, toast])

  const handleVote = async (optionId: string) => {
    setSelectedOption(optionId)

    try {
      const result = await submitVote(roomCode, optionId)

      if (result.success) {
        setHasVoted(true)

        toast({
          title: "Vote submitted!",
          description: "Your vote has been recorded.",
        })

        // Refresh room details to update participant status
        const updatedRoom = await getRoomDetails(roomCode)
        if (updatedRoom.success) {
          setParticipants(updatedRoom.participants || [])
        }
      } else {
        toast({
          title: "Failed to submit vote",
          description: result.message || "Please try again.",
          variant: "destructive",
        })
        setSelectedOption(null)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit vote",
        variant: "destructive",
      })
      setSelectedOption(null)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const handleLogout = async () => {
    await logout()
  }

  if (isLoadingRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-lg">Loading voting page...</p>
          </CardContent>
        </Card>
      </div>
    )
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
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white/10 text-white border-white/20">
              Room: {roomCode}
            </Badge>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={handleLogout}>
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-2xl">Vote for Your Favorite</CardTitle>
                <CardDescription className="text-white/70">
                  Select one option. You cannot vote for your own submission.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!hasVoted && (
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
                        Time remaining: {formatTime(timeLeft)}
                      </Badge>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {options.map((option) => {
                      const isDisabled = option.createdBy.toString() === currentUserId || hasVoted
                      const isSelected = selectedOption === option._id?.toString()

                      return (
                        <div
                          key={option._id?.toString()}
                          className={`
                            relative overflow-hidden rounded-lg border border-white/20 transition-all
                            ${isDisabled ? "opacity-60" : "cursor-pointer hover:bg-white/10 hover:border-white/40"}
                            ${isSelected ? "bg-purple-600/30 border-purple-400" : "bg-white/5"}
                          `}
                          onClick={() => !isDisabled && handleVote(option._id!.toString())}
                        >
                          <div className="p-4">
                            <div className="text-lg font-medium mb-1">{option.text}</div>
                            {option.createdBy.toString() === currentUserId && (
                              <Badge className="bg-blue-500">Your submission</Badge>
                            )}
                          </div>

                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-purple-600 rounded-full p-1">
                              <Check className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                {hasVoted ? (
                  <div className="w-full text-center">
                    <Badge className="bg-green-500">Vote submitted!</Badge>
                    <p className="mt-2 text-white/70">Waiting for others to vote...</p>
                  </div>
                ) : (
                  <p className="text-white/70 text-center">Click on an option to cast your vote</p>
                )}
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Voting Progress</span>
                  <Badge className="bg-purple-600">{votingProgress}%</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={votingProgress} className="h-2 bg-white/20" />

                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div
                      key={participant._id?.toString()}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-white/5"
                    >
                      <Avatar>
                        <AvatarFallback className="bg-purple-700 text-white">
                          {participant.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{participant.name}</span>
                          {participant.userId.toString() === currentUserId && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                      </div>
                      {participant.hasVoted ? (
                        <Badge className="bg-green-500">Voted</Badge>
                      ) : (
                        <Badge variant="outline" className="border-white/20">
                          Waiting
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardHeader>
                <CardTitle>Voting Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 list-disc list-inside text-white/80">
                  <li>Each person gets one vote</li>
                  <li>You cannot vote for your own submission</li>
                  <li>Votes are anonymous</li>
                  <li>In case of a tie, a tiebreaker will be used</li>
                  <li>The decision is final once voting completes</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
