"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dices, Link2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { joinRoomByCode } from "../actions/rooms"

export default function JoinRoomPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [roomCode, setRoomCode] = useState("")
  const [roomLink, setRoomLink] = useState("")

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomCode.trim()) {
      toast({
        title: "Room code required",
        description: "Please enter a valid room code",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await joinRoomByCode(roomCode.trim())

      if (result.success) {
        toast({
          title: "Room joined!",
          description: "Redirecting to room lobby...",
        })

        // Redirect to room
        router.push(`/room/${result.roomCode}`)
      } else {
        toast({
          title: "Failed to join room",
          description: result.message || "Invalid room code or the room no longer exists.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Failed to join room",
        description: "An error occurred while joining the room.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomLink.trim()) {
      toast({
        title: "Room link required",
        description: "Please enter a valid room link",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Extract room code from link
      const url = new URL(roomLink)
      const pathSegments = url.pathname.split("/")
      const extractedCode = pathSegments[pathSegments.length - 1]

      if (!extractedCode) {
        throw new Error("Invalid room link")
      }

      const result = await joinRoomByCode(extractedCode)

      if (result.success) {
        toast({
          title: "Room joined!",
          description: "Redirecting to room lobby...",
        })

        // Redirect to room
        router.push(`/room/${result.roomCode}`)
      } else {
        toast({
          title: "Failed to join room",
          description: result.message || "Invalid room link or the room no longer exists.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Failed to join room",
        description: "Invalid room link or the room no longer exists.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex bg-white rounded-full p-3 mb-4">
            <Dices className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">Join Decision Room</h1>
          <p className="text-white/80">Enter a room code or paste a link</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Join with Code</CardTitle>
            <CardDescription>Enter the 6-character room code</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomCode">Room Code</Label>
                <Input
                  id="roomCode"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="e.g., ABC123"
                  className="text-center text-lg font-bold tracking-wider"
                  maxLength={6}
                />
              </div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                {isLoading ? "Joining..." : "Join Room"}
              </Button>
            </form>
          </CardContent>

          <div className="px-6 py-2">
            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-2 text-sm text-gray-500">OR</span>
              </div>
            </div>
          </div>

          <CardHeader className="pb-2">
            <CardTitle>Join with Link</CardTitle>
            <CardDescription>Paste the invitation link</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLinkSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomLink" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Room Link
                </Label>
                <Input
                  id="roomLink"
                  value={roomLink}
                  onChange={(e) => setRoomLink(e.target.value)}
                  placeholder="https://dicey-decisions.com/room/ABC123"
                />
              </div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                {isLoading ? "Joining..." : "Join via Link"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
