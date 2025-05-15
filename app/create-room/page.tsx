"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, Dices, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createNewRoom } from "../actions/rooms"

export default function CreateRoomPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [roomCreated, setRoomCreated] = useState(false)
  const [roomCode, setRoomCode] = useState("")
  const [roomLink, setRoomLink] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    maxParticipants: 10,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formDataObj = new FormData()
      formDataObj.append("title", formData.title)
      formDataObj.append("description", formData.description)
      formDataObj.append("maxParticipants", formData.maxParticipants.toString())

      const result = await createNewRoom(formDataObj)

      if (result.success) {
        setRoomCode(result.roomCode!)
        setRoomLink(`${window.location.origin}/room/${result.roomCode}`)
        setRoomCreated(true)

        toast({
          title: "Room created successfully!",
          description: "Share the code with your friends to join.",
        })
      } else {
        toast({
          title: "Failed to create room",
          description: result.message || "Please try again later.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Failed to create room",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string, type: "code" | "link") => {
    navigator.clipboard.writeText(text)
    toast({
      title: `${type === "code" ? "Room code" : "Room link"} copied!`,
      description: "You can now share it with others.",
    })
  }

  const goToRoom = () => {
    router.push(`/room/${roomCode}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex bg-white rounded-full p-3 mb-4">
            <Dices className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create Decision Room</h1>
          <p className="text-white/80">Set up a new room for group decisions</p>
        </div>

        {!roomCreated ? (
          <Card className="border-0 shadow-xl">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Room Details</CardTitle>
                <CardDescription>Fill in the information for your decision room</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Room Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Movie Night Selection"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="What are you deciding on?"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxParticipants" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Max Participants
                  </Label>
                  <Input
                    id="maxParticipants"
                    name="maxParticipants"
                    type="number"
                    min={2}
                    max={50}
                    value={formData.maxParticipants}
                    onChange={handleChange}
                  />
                  <p className="text-sm text-gray-500">Leave at default for unlimited participants</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={isLoading || !formData.title}
                >
                  {isLoading ? "Creating Room..." : "Create Room"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-center text-green-600">Room Created!</CardTitle>
              <CardDescription className="text-center">Share this information with your friends</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Room Title</Label>
                <div className="p-3 bg-gray-100 rounded-md font-medium">{formData.title}</div>
              </div>

              <div className="space-y-2">
                <Label className="flex justify-between">
                  Room Code
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-2 text-purple-600"
                    onClick={() => copyToClipboard(roomCode, "code")}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </Label>
                <div className="p-3 bg-purple-100 rounded-md font-bold text-center text-purple-800 text-xl tracking-wider">
                  {roomCode}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex justify-between">
                  Shareable Link
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-2 text-purple-600"
                    onClick={() => copyToClipboard(roomLink, "link")}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </Label>
                <div className="p-3 bg-gray-100 rounded-md text-sm break-all">{roomLink}</div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={goToRoom} className="w-full bg-green-600 hover:bg-green-700">
                Enter Room Lobby
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
