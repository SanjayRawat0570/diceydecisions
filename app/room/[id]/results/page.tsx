"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Dices, Trophy, User, ArrowRight, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getRoomDetails, completeRoomWithTiebreaker, completeRoomWithWinner } from "../../../actions/rooms"
import { logout } from "../../../actions/auth"
import type { Option } from "@/lib/models"

export default function ResultsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [results, setResults] = useState<Option[]>([])
  const [showTiebreaker, setShowTiebreaker] = useState(false)
  const [tiebreakerType, setTiebreakerType] = useState<"dice" | "spinner" | "coin" | null>(null)
  const [tiebreakerInProgress, setTiebreakerInProgress] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isLoadingRoom, setIsLoadingRoom] = useState(true)
  const [isCreator, setIsCreator] = useState(false)
  const [roomTitle, setRoomTitle] = useState("")
  const [roomStatus, setRoomStatus] = useState<"lobby" | "voting" | "completed">("voting")
  const [tiedOptions, setTiedOptions] = useState<Option[]>([])
  const roomCode = params.id.toUpperCase()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const diceRef = useRef<HTMLDivElement>(null)
  const spinnerRef = useRef<HTMLDivElement>(null)
  const coinRef = useRef<HTMLDivElement>(null)

  // Load room details
  useEffect(() => {
    async function loadRoomDetails() {
      try {
        const result = await getRoomDetails(roomCode)

        if (result.success) {
          setResults(result.options || [])
          setIsCreator(result.isCreator || false)
          setRoomTitle(result.room?.title || "")
          setRoomStatus(result.room?.status || "voting")

          // If room is in lobby state, redirect to lobby
          if (result.room?.status === "lobby") {
            router.push(`/room/${roomCode}`)
          } else if (result.room?.status === "voting") {
            router.push(`/room/${roomCode}/vote`)
          } else if (result.room?.status === "completed") {
            // Room is already completed, set the winner
            setWinner((result.options ?? []).find((o) => o.text === result.room?.finalDecision)?._id?.toString() || null)
            setTiebreakerType(result.room?.tiebreaker || null)
            setShowConfetti(true)
          } else {
            // Check for tie
            checkForTie(result.options || [])
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
  }, [roomCode, router, toast])

  // Check for tie on initial load
  const checkForTie = (options: Option[]) => {
    // Sort results by votes (descending)
    const sortedResults = [...options].sort((a, b) => b.votes - a.votes)

    // Check if there's a tie for first place
    if (sortedResults.length >= 2 && sortedResults[0].votes === sortedResults[1].votes && sortedResults[0].votes > 0) {
      const tied = sortedResults.filter((option) => option.votes === sortedResults[0].votes)
      setTiedOptions(tied)
      setShowTiebreaker(true)

      toast({
        title: "It's a tie!",
        description: "A tiebreaker is needed to determine the winner.",
      })
    } else if (sortedResults.length > 0) {
      // If no tie, set the winner
      setWinner(sortedResults[0]._id?.toString() || null)

      // If creator, complete the room
      if (isCreator && roomStatus !== "completed") {
        completeRoomWithWinner(roomCode, sortedResults[0]._id!.toString())
      }

      setShowConfetti(true)
    }
  }

  // Calculate max votes for progress bars
  const maxVotes = Math.max(...results.map((result) => result.votes), 1)

  const runTiebreaker = async (type: "dice" | "spinner" | "coin") => {
    if (!isCreator) {
      toast({
        title: "Permission denied",
        description: "Only the room creator can run the tiebreaker",
        variant: "destructive",
      })
      return
    }

    setTiebreakerType(type)
    setTiebreakerInProgress(true)

    toast({
      title: "Running tiebreaker!",
      description: `Using ${type} to determine the winner...`,
    })

    // Randomly select a winner from tied options
    const randomIndex = Math.floor(Math.random() * tiedOptions.length)
    const winnerId = tiedOptions[randomIndex]._id!.toString()

    // Simulate tiebreaker animation
    setTimeout(async () => {
      try {
        const result = await completeRoomWithTiebreaker(roomCode, winnerId, type)

        if (result.success) {
          setWinner(winnerId)
          setTiebreakerInProgress(false)
          setShowConfetti(true)
          setShowTiebreaker(false)

          toast({
            title: "We have a winner!",
            description: `The tiebreaker has determined the winner.`,
          })

          // Refresh room details
          const updatedRoom = await getRoomDetails(roomCode)
          if (updatedRoom.success) {
            setResults(updatedRoom.options || [])
            setRoomStatus(updatedRoom.room?.status || "completed")
          }
        } else {
          toast({
            title: "Failed to complete room",
            description: result.message || "Please try again.",
            variant: "destructive",
          })
          setTiebreakerInProgress(false)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to complete room",
          variant: "destructive",
        })
        setTiebreakerInProgress(false)
      }
    }, 3000)
  }

  // Dice roll animation
  useEffect(() => {
    if (tiebreakerType === "dice" && diceRef.current) {
      const dice = diceRef.current
      dice.classList.add("animate-dice-roll")

      return () => {
        dice.classList.remove("animate-dice-roll")
      }
    }
  }, [tiebreakerType])

  // Spinner animation
  useEffect(() => {
    if (tiebreakerType === "spinner" && spinnerRef.current) {
      const spinner = spinnerRef.current
      spinner.style.transform = `rotate(${Math.floor(Math.random() * 360) + 1440}deg)`
      spinner.style.transition = "transform 3s cubic-bezier(0.2, 0.8, 0.2, 1)"
    }
  }, [tiebreakerType])

  // Coin flip animation
  useEffect(() => {
    if (tiebreakerType === "coin" && coinRef.current) {
      const coin = coinRef.current
      coin.classList.add("animate-coin-flip")

      return () => {
        coin.classList.remove("animate-coin-flip")
      }
    }
  }, [tiebreakerType])

  // Confetti effect
  useEffect(() => {
    if (showConfetti && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      const particles: {
        x: number
        y: number
        size: number
        color: string
        speed: number
        angle: number
      }[] = []

      // Create particles
      const colors = ["#FFC700", "#FF0099", "#00FFFF", "#14F73B", "#FF3C00"]
      for (let i = 0; i < 200; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          size: Math.random() * 8 + 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          speed: Math.random() * 3 + 1,
          angle: Math.random() * Math.PI * 2,
        })
      }

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        particles.forEach((particle) => {
          particle.y += particle.speed
          particle.x += Math.sin(particle.angle) * 0.5

          ctx.fillStyle = particle.color
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fill()

          // Reset particle if it goes off screen
          if (particle.y > canvas.height) {
            particle.y = -10
            particle.x = Math.random() * canvas.width
          }
        })

        requestAnimationFrame(animate)
      }

      animate()

      // Stop confetti after 5 seconds
      setTimeout(() => {
        setShowConfetti(false)
      }, 5000)
    }
  }, [showConfetti])

  const getWinnerDetails = () => {
    if (!winner) return null
    return results.find((result) => result._id?.toString() === winner)
  }

  const winnerDetails = getWinnerDetails()

  const handleLogout = async () => {
    await logout()
  }

  if (isLoadingRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-lg">Loading results...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
      {showConfetti && <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />}

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
            {showTiebreaker && !winner ? (
              <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-yellow-400" />
                    It's a Tie!
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    We need a tiebreaker to determine the winner
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-4 mb-6 bg-white/5 rounded-lg">
                    <h3 className="text-xl font-bold mb-2">Tied Options</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      {tiedOptions.map((option) => (
                        <Badge key={option._id?.toString()} className="bg-purple-600 text-white px-3 py-1 text-base">
                          {option.text}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-4 text-center">Choose a Tiebreaker</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={() => runTiebreaker("dice")}
                      disabled={tiebreakerInProgress || !isCreator}
                      className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 h-auto py-6 flex flex-col items-center gap-2"
                    >
                      <div className="bg-white rounded-lg p-2 mb-2">
                        <div className="text-3xl">🎲</div>
                      </div>
                      <span className="text-lg font-bold">Dice Roll</span>
                      <span className="text-xs opacity-80">Random number decides</span>
                    </Button>

                    <Button
                      onClick={() => runTiebreaker("spinner")}
                      disabled={tiebreakerInProgress || !isCreator}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 h-auto py-6 flex flex-col items-center gap-2"
                    >
                      <div className="bg-white rounded-lg p-2 mb-2">
                        <div className="text-3xl">🎡</div>
                      </div>
                      <span className="text-lg font-bold">Spinner</span>
                      <span className="text-xs opacity-80">Wheel of fortune</span>
                    </Button>

                    <Button
                      onClick={() => runTiebreaker("coin")}
                      disabled={tiebreakerInProgress || !isCreator}
                      className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 h-auto py-6 flex flex-col items-center gap-2"
                    >
                      <div className="bg-white rounded-lg p-2 mb-2">
                        <div className="text-3xl">🪙</div>
                      </div>
                      <span className="text-lg font-bold">Coin Flip</span>
                      <span className="text-xs opacity-80">Heads or tails</span>
                    </Button>
                  </div>

                  {!isCreator && (
                    <div className="mt-4 p-3 bg-white/10 rounded-md text-center">
                      Waiting for the room creator to choose a tiebreaker...
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 -rotate-45 transform translate-x-16 -translate-y-16 opacity-20 rounded-full"></div>

                <CardHeader className="relative z-10">
                  <CardTitle className="text-3xl flex items-center gap-2">
                    <Trophy className="h-7 w-7 text-yellow-400" />
                    Decision Results
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    The votes are in! Here's what the group decided.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  {winnerDetails && (
                    <div className="mb-8 text-center">
                      <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 p-1 rounded-xl mb-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                          <h2 className="text-xl font-medium mb-2">Winner</h2>
                          <div className="text-3xl font-bold text-white mb-2">{winnerDetails.text}</div>
                          <Badge className="bg-yellow-500 text-black">
                            {winnerDetails.votes} {winnerDetails.votes === 1 ? "vote" : "votes"}
                          </Badge>
                        </div>
                      </div>

                      {tiebreakerType && (
                        <Badge className="bg-purple-600">
                          Decided by{" "}
                          {tiebreakerType === "dice"
                            ? "Dice Roll"
                            : tiebreakerType === "spinner"
                              ? "Spinner"
                              : "Coin Flip"}
                        </Badge>
                      )}
                    </div>
                  )}

                  <h3 className="font-bold text-xl mb-4">All Results</h3>
                  <div className="space-y-4">
                    {results
                      .sort((a, b) => b.votes - a.votes)
                      .map((result) => (
                        <div
                          key={result._id?.toString()}
                          className={`
                            p-3 rounded-md transition-colors
                            ${result._id?.toString() === winner ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30" : "bg-white/5"}
                          `}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">
                              {result.text}
                              {result._id?.toString() === winner && (
                                <Trophy className="h-4 w-4 text-yellow-400 inline ml-2" />
                              )}
                            </div>
                            <Badge
                              className={result._id?.toString() === winner ? "bg-yellow-500 text-black" : "bg-white/20"}
                            >
                              {result.votes} {result.votes === 1 ? "vote" : "votes"}
                            </Badge>
                          </div>
                          <Progress
                            value={maxVotes > 0 ? (result.votes / maxVotes) * 100 : 0}
                            className={`h-2 ${result._id?.toString() === winner ? "bg-white/20" : "bg-white/10"}`}
                          />
                        </div>
                      ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button onClick={() => router.push("/dashboard")} className="bg-purple-600 hover:bg-purple-700">
                    Back to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {tiebreakerType && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white overflow-hidden">
                <CardHeader>
                  <CardTitle>Tiebreaker Animation</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center p-8">
                  {tiebreakerType === "dice" && (
                    <div
                      ref={diceRef}
                      className="relative w-24 h-24 bg-white rounded-lg shadow-lg flex items-center justify-center text-4xl"
                    >
                      {tiebreakerInProgress ? (
                        <div className="animate-pulse">🎲</div>
                      ) : (
                        <div>{Math.floor(Math.random() * 6) + 1}</div>
                      )}
                    </div>
                  )}

                  {tiebreakerType === "spinner" && (
                    <div className="relative w-48 h-48">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500"></div>
                      <div
                        ref={spinnerRef}
                        className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center"
                        style={{ transformOrigin: "center" }}
                      >
                        <div className="absolute w-1 h-12 bg-white top-0 left-1/2 -translate-x-1/2"></div>
                        <div className="w-4 h-4 rounded-full bg-white"></div>
                      </div>
                    </div>
                  )}

                  {tiebreakerType === "coin" && (
                    <div
                      ref={coinRef}
                      className="relative w-24 h-24 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full shadow-lg flex items-center justify-center text-4xl perspective-500"
                    >
                      {tiebreakerInProgress ? (
                        <div className="animate-pulse">🪙</div>
                      ) : (
                        <div>{Math.random() > 0.5 ? "H" : "T"}</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardHeader>
                <CardTitle>Decision Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm text-white/70">Room Title</div>
                  <div className="font-medium">{roomTitle}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-white/70">Total Votes</div>
                  <div className="font-medium">{results.reduce((sum, result) => sum + result.votes, 0)}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-white/70">Options</div>
                  <div className="font-medium">{results.length}</div>
                </div>

                {tiebreakerType && (
                  <div className="space-y-2">
                    <div className="text-sm text-white/70">Tiebreaker Used</div>
                    <div className="font-medium">
                      {tiebreakerType === "dice" ? "Dice Roll" : tiebreakerType === "spinner" ? "Spinner" : "Coin Flip"}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                  onClick={() => router.push("/past-decisions")}
                >
                  View Past Decisions
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardHeader>
                <CardTitle>What's Next?</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="new">
                  <TabsList className="grid w-full grid-cols-2 bg-white/10">
                    <TabsTrigger value="new">New Decision</TabsTrigger>
                    <TabsTrigger value="share">Share Results</TabsTrigger>
                  </TabsList>
                  <TabsContent value="new" className="pt-4">
                    <p className="mb-4">Ready to make another decision?</p>
                    <Button
                      className="w-full bg-green-500 hover:bg-green-600"
                      onClick={() => router.push("/create-room")}
                    >
                      Create New Room
                    </Button>
                  </TabsContent>
                  <TabsContent value="share" className="pt-4">
                    <p className="mb-4">Share this decision with others:</p>
                    <Button
                      className="w-full bg-blue-500 hover:bg-blue-600"
                      onClick={() => {
                        navigator.clipboard.writeText(`Check out our decision: ${winnerDetails?.text}`)
                        toast({
                          title: "Copied to clipboard!",
                          description: "You can now share the results with others.",
                        })
                      }}
                    >
                      Copy Results
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
