"use server"

import { ObjectId } from "mongodb"
import {
  createRoom,
  getRoomByCode,
  getUserRooms,
  updateRoomStatus,
  completeRoom,
  addOption,
  getRoomOptions,
  removeOption,
  joinRoom,
  getRoomParticipants,
  voteForOption,
} from "@/lib/db"
import { getCurrentUser } from "./auth"

// Room creation
export async function createNewRoom(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "You must be logged in" }
    }

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const maxParticipantsStr = formData.get("maxParticipants") as string
    const maxParticipants = maxParticipantsStr ? Number.parseInt(maxParticipantsStr) : undefined

    if (!title) {
      return { success: false, message: "Room title is required" }
    }

    const { insertedId, code } = await createRoom({
      title,
      description,
      maxParticipants,
      creatorId: new ObjectId(user.id),
    })

    // Add creator as participant
    await joinRoom(insertedId, new ObjectId(user.id))

    return {
      success: true,
      roomId: insertedId.toString(),
      roomCode: code,
    }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to create room" }
  }
}

// Join room
export async function joinRoomByCode(code: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "You must be logged in" }
    }

    const room = await getRoomByCode(code)
    if (!room) {
      return { success: false, message: "Room not found" }
    }

    await joinRoom(room._id!, new ObjectId(user.id))

    return {
      success: true,
      roomId: room._id!.toString(),
      roomCode: room.code,
    }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to join room" }
  }
}

// Get user's rooms
export async function getUserDecisionRooms() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "You must be logged in" }
    }

    const rooms = await getUserRooms(user.id)

    return {
      success: true,
      rooms,
    }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to get rooms" }
  }
}

// Get room details
export async function getRoomDetails(roomCode: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "You must be logged in" }
    }

    const room = await getRoomByCode(roomCode)
    if (!room) {
      return { success: false, message: "Room not found" }
    }

    const options = await getRoomOptions(room._id!)
    const participants = await getRoomParticipants(room._id!)

    const isCreator = room.creatorId.toString() === user.id

    return {
      success: true,
      room,
      options,
      participants,
      isCreator,
      currentUserId: user.id,
    }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to get room details" }
  }
}

// Add option
export async function addRoomOption(roomCode: string, optionText: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "You must be logged in" }
    }

    const room = await getRoomByCode(roomCode)
    if (!room) {
      return { success: false, message: "Room not found" }
    }

    if (room.status !== "lobby") {
      return { success: false, message: "Cannot add options after voting has started" }
    }

    await addOption({
      roomId: room._id!,
      text: optionText,
      createdBy: new ObjectId(user.id),
    })

    return { success: true }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to add option" }
  }
}

// Remove option
export async function removeRoomOption(roomCode: string, optionId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "You must be logged in" }
    }

    const room = await getRoomByCode(roomCode)
    if (!room) {
      return { success: false, message: "Room not found" }
    }

    if (room.status !== "lobby") {
      return { success: false, message: "Cannot remove options after voting has started" }
    }

    const success = await removeOption(optionId, user.id)

    return { success }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to remove option" }
  }
}

// Start voting
export async function startRoomVoting(roomCode: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "You must be logged in" }
    }

    const room = await getRoomByCode(roomCode)
    if (!room) {
      return { success: false, message: "Room not found" }
    }

    if (room.creatorId.toString() !== user.id) {
      return { success: false, message: "Only the room creator can start voting" }
    }

    const options = await getRoomOptions(room._id!)
    if (options.length < 2) {
      return { success: false, message: "At least 2 options are required to start voting" }
    }

    await updateRoomStatus(room._id!, "voting")

    return { success: true }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to start voting" }
  }
}

// Submit vote
export async function submitVote(roomCode: string, optionId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "You must be logged in" }
    }

    const room = await getRoomByCode(roomCode)
    if (!room) {
      return { success: false, message: "Room not found" }
    }

    if (room.status !== "voting") {
      return { success: false, message: "Voting is not active for this room" }
    }

    // Get the option to check if user is voting for their own option
    const options = await getRoomOptions(room._id!)
    const option = options.find((o) => o._id!.toString() === optionId)

    if (!option) {
      return { success: false, message: "Option not found" }
    }

    if (option.createdBy.toString() === user.id) {
      return { success: false, message: "You cannot vote for your own option" }
    }

    await voteForOption(optionId, user.id, room._id!)

    return { success: true }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to submit vote" }
  }
}

// Complete room with tiebreaker
export async function completeRoomWithTiebreaker(
  roomCode: string,
  winningOptionId: string,
  tiebreakerType: "dice" | "spinner" | "coin",
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "You must be logged in" }
    }

    const room = await getRoomByCode(roomCode)
    if (!room) {
      return { success: false, message: "Room not found" }
    }

    if (room.creatorId.toString() !== user.id) {
      return { success: false, message: "Only the room creator can complete the room" }
    }

    const options = await getRoomOptions(room._id!)
    const winningOption = options.find((o) => o._id!.toString() === winningOptionId)

    if (!winningOption) {
      return { success: false, message: "Winning option not found" }
    }

    await completeRoom(room._id!, winningOption.text, tiebreakerType)

    return { success: true }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to complete room" }
  }
}

// Complete room without tiebreaker
export async function completeRoomWithWinner(roomCode: string, winningOptionId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "You must be logged in" }
    }

    const room = await getRoomByCode(roomCode)
    if (!room) {
      return { success: false, message: "Room not found" }
    }

    if (room.creatorId.toString() !== user.id) {
      return { success: false, message: "Only the room creator can complete the room" }
    }

    const options = await getRoomOptions(room._id!)
    const winningOption = options.find((o) => o._id!.toString() === winningOptionId)

    if (!winningOption) {
      return { success: false, message: "Winning option not found" }
    }

    await completeRoom(room._id!, winningOption.text)

    return { success: true }
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to complete room" }
  }
}
