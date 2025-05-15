"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Copy, Dices, Plus, Trash, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
// import { getRoomDetails, addRoomOption, removeRoomOption, startRoomVoting } from "../../../actions/room"
// import { logout } from "@/actions/auth"
import type { Option, Participant } from "@/lib/models"
import { logout } from "@/app/actions/auth"
import { addRoomOption, getRoomDetails, removeRoomOption, startRoomVoting } from "@/app/actions/rooms"

export default function RoomLobbyPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [newOption, setNewOption] = useState("")
  const [options, setOptions] = useState<Option[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [roomTitle, setRoomTitle] = useState("")
  const [roomDescription, setRoomDescription] = useState("")
  const [isCreator, setIsCreator] = useState(false)
  const [currentUserId, setCurrentUserId] = useState("")
  const [isLoadingRoom, setIsLoadingRoom] = useState(true)
  const roomCode = params.id.toUpperCase()

  useEffect(() => {
    async function loadRoomDetails() {
      try {
        const result = await getRoomDetails(roomCode)

        if (result.success) {
          setOptions(result.options || [])
          setParticipants(result.participants || [])
          setRoomTitle(result.room?.title || "")
          setRoomDescription(result.room?.description || "")
          setIsCreator(result.isCreator || false)
          setCurrentUserId(result.currentUserId || "")

          // If room is in voting state, redirect to voting page
          if (result.room?.status === "voting") {
            router.push(`/room/${roomCode}/vote`)
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
  }, [roomCode, router, toast])

  const addOption = async () => {
    if (!newOption.trim()) return

    try {
      const result = await addRoomOption(roomCode, newOption.trim())

      if (result.success) {
        // Refresh room details to get updated options
        const updatedRoom = await getRoomDetails(roomCode)
        if (updatedRoom.success) {
          setOptions(updatedRoom.options || [])
        }

        setNewOption("")

        toast({
          title: "Option added",
          description: "Your option has been added to the list.",
        })
      } else {
        toast({
          title: "Failed to add option",
          description: result.message || "Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add option",
        variant: "destructive",
      })
    }
  }

  const removeOption = async (id: string) => {
    try {
      const result = await removeRoomOption(roomCode, id)

      if (result.success) {
        // Refresh room details to get updated options
        const updatedRoom = await getRoomDetails(roomCode)
        if (updatedRoom.success) {
          setOptions(updatedRoom.options || [])
        }

        toast({
          title: "Option removed",
          description: "The option has been removed from the list.",
        })
      } else {
        toast({
          title: "Failed to remove option",
          description: result.message || "Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove option",
        variant: "destructive",
      })
    }
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    toast({
      title: "Room code copied!",
      description: "You can now share it with others.",
    })
  }

  const startVoting = async () => {
    if (options.length < 2) {
      toast({
        title: "Not enough options",
        description: "You need at least 2 options to start voting.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await startRoomVoting(roomCode)

      if (result.success) {
        toast({
          title: "Voting started!",
          description: "All participants can now vote on the options.",
        })
        router.push(`/room/${roomCode}/vote`)
      } else {
        toast({
          title: "Failed to start voting",
          description: result.message || "Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start voting",
        variant: "destructive",
      })
      setIsLoading(false)
    }
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
            <p className="text-lg">Loading room details...</p>
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
            <Badge
              variant="outline"
              className="bg-white/10 text-white border-white/20 flex items-center gap-1 cursor-pointer"
              onClick={copyRoomCode}
            >
              Room: {roomCode}
              <Copy className="h-3 w-3 ml-1" />
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
                <CardTitle className="text-2xl">{roomTitle}</CardTitle>
                <CardDescription className="text-white/70">
                  {roomDescription || "Add options for the decision. Everyone can suggest their favorites!"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add your option here..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    onKeyDown={(e) => e.key === "Enter" && addOption()}
                  />
                  <Button onClick={addOption} className="bg-green-500 hover:bg-green-600">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2 mt-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <span>Current Options</span>
                    <Badge className="bg-purple-600">{options.length}</Badge>
                  </h3>

                  {options.length === 0 ? (
                    <div className="p-4 text-center text-white/60 bg-white/5 rounded-md">
                      No options added yet. Be the first to suggest something!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {options.map((option) => (
                        <div
                          key={option._id?.toString()}
                          className="flex items-center justify-between p-3 bg-white/10 rounded-md"
                        >
                          <span>{option.text}</span>
                          {option.createdBy.toString() === currentUserId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                              onClick={() => removeOption(option._id!.toString())}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                {isCreator && (
                  <Button
                    onClick={startVoting}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={isLoading || options.length < 2}
                  >
                    {isLoading ? "Starting Voting..." : "Start Voting"}
                  </Button>
                )}
              </CardFooter>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4 list-decimal list-inside">
                  <li className="p-3 bg-white/5 rounded-md">
                    <span className="font-bold">Add Options</span>: Everyone can suggest options for the decision
                  </li>
                  <li className="p-3 bg-white/5 rounded-md">
                    <span className="font-bold">Vote</span>: Each participant gets one vote (you can't vote for your own
                    suggestion)
                  </li>
                  <li className="p-3 bg-white/5 rounded-md">
                    <span className="font-bold">Results</span>: See which option wins! In case of a tie, use a fun
                    tiebreaker
                  </li>
                  <li className="p-3 bg-white/5 rounded-md">
                    <span className="font-bold">Decision Made</span>: The winning option becomes your group's decision
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Participants</span>
                  <Badge className="bg-green-500">{participants.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                      {participant.userId.toString() === currentUserId && isCreator && (
                        <Badge className="bg-yellow-500 text-black">Creator</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                  onClick={copyRoomCode}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Share Room Code
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardHeader>
                <CardTitle>Room Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-2 rounded-md bg-white/5">
                  <span>Allow Late Joining</span>
                  <Badge className="bg-green-500">Enabled</Badge>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md bg-white/5">
                  <span>Max Participants</span>
                  <Badge variant="outline" className="border-white/20">
                    10
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md bg-white/5">
                  <span>Options Per Person</span>
                  <Badge variant="outline" className="border-white/20">
                    Unlimited
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  onClick={() => router.push("/dashboard")}
                >
                  Leave Room
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
