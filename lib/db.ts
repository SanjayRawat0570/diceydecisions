import { ObjectId } from "mongodb"
import clientPromise from "./mongodb"
import type { User, Room, Option, Participant } from "./models"
import { hash, compare } from "bcrypt"

// Database and collections
const DB_NAME = "dicey-decisions"
const COLLECTIONS = {
  USERS: "users",
  ROOMS: "rooms",
  OPTIONS: "options",
  PARTICIPANTS: "participants",
}

// Get MongoDB collections
export async function getCollections() {
  const client = await clientPromise
  const db = client.db(DB_NAME)

  return {
    users: db.collection<User>(COLLECTIONS.USERS),
    rooms: db.collection<Room>(COLLECTIONS.ROOMS),
    options: db.collection<Option>(COLLECTIONS.OPTIONS),
    participants: db.collection<Participant>(COLLECTIONS.PARTICIPANTS),
  }
}

// User operations
export async function createUser(userData: Omit<User, "_id" | "createdAt">) {
  const { users } = await getCollections()

  // Check if user already exists
  const existingUser = await users.findOne({ email: userData.email })
  if (existingUser) {
    throw new Error("User already exists")
  }

  // Hash password
  const hashedPassword = await hash(userData.password, 10)

  // Create user
  const result = await users.insertOne({
    ...userData,
    password: hashedPassword,
    createdAt: new Date(),
  })

  return result.insertedId
}

export async function getUserByEmail(email: string) {
  const { users } = await getCollections()
  return users.findOne({ email })
}

export async function validateUser(email: string, password: string) {
  const user = await getUserByEmail(email)
  if (!user) return null

  const isValid = await compare(password, user.password)
  if (!isValid) return null

  // Don't return the password
  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword
}

// Room operations
export async function createRoom(roomData: Omit<Room, "_id" | "createdAt" | "status" | "code">) {
  const { rooms } = await getCollections()

  // Generate a unique room code
  const code = generateRoomCode()

  // Create room
  const result = await rooms.insertOne({
    ...roomData,
    code,
    status: "lobby",
    createdAt: new Date(),
  })

  return { insertedId: result.insertedId, code }
}

export async function getRoomByCode(code: string) {
  const { rooms } = await getCollections()
  return rooms.findOne({ code })
}

export async function getUserRooms(userId: string | ObjectId) {
  const { rooms, participants } = await getCollections()

  // Find rooms where user is a participant
  const userParticipations = await participants.find({ userId: new ObjectId(userId) }).toArray()
  const roomIds = userParticipations.map((p) => p.roomId)

  // Find rooms created by user
  const userRooms = await rooms
    .find({
      $or: [{ creatorId: new ObjectId(userId) }, { _id: { $in: roomIds } }],
    })
    .toArray()

  return userRooms
}

export async function updateRoomStatus(roomId: string | ObjectId, status: Room["status"]) {
  const { rooms } = await getCollections()

  const result = await rooms.updateOne({ _id: new ObjectId(roomId) }, { $set: { status } })

  return result.modifiedCount > 0
}

export async function completeRoom(roomId: string | ObjectId, finalDecision: string, tiebreaker?: Room["tiebreaker"]) {
  const { rooms } = await getCollections()

  const result = await rooms.updateOne(
    { _id: new ObjectId(roomId) },
    {
      $set: {
        status: "completed",
        finalDecision,
        tiebreaker,
        resolvedAt: new Date(),
      },
    },
  )

  return result.modifiedCount > 0
}

// Option operations
export async function addOption(optionData: Omit<Option, "_id" | "votes">) {
  const { options } = await getCollections()

  const result = await options.insertOne({
    ...optionData,
    votes: 0,
  })

  return result.insertedId
}

export async function getRoomOptions(roomId: string | ObjectId) {
  const { options } = await getCollections()
  return options.find({ roomId: new ObjectId(roomId) }).toArray()
}

export async function removeOption(optionId: string | ObjectId, userId: string | ObjectId) {
  const { options } = await getCollections()

  const result = await options.deleteOne({
    _id: new ObjectId(optionId),
    createdBy: new ObjectId(userId),
  })

  return result.deletedCount > 0
}

export async function voteForOption(optionId: string | ObjectId, userId: string | ObjectId, roomId: string | ObjectId) {
  const { options, participants } = await getCollections()

  // Mark user as voted
  await participants.updateOne(
    { roomId: new ObjectId(roomId), userId: new ObjectId(userId) },
    { $set: { hasVoted: true } },
  )

  // Increment vote count
  const result = await options.updateOne({ _id: new ObjectId(optionId) }, { $inc: { votes: 1 } })

  return result.modifiedCount > 0
}

// Participant operations
export async function joinRoom(roomId: string | ObjectId, userId: string | ObjectId) {
  const { participants, rooms } = await getCollections()

  // Check if room exists
  const room = await rooms.findOne({ _id: new ObjectId(roomId) })
  if (!room) {
    throw new Error("Room not found")
  }

  // Check if user is already a participant
  const existingParticipant = await participants.findOne({
    roomId: new ObjectId(roomId),
    userId: new ObjectId(userId),
  })

  if (existingParticipant) {
    return existingParticipant._id
  }

  // Add user as participant
  const result = await participants.insertOne({
    roomId: new ObjectId(roomId),
    userId: new ObjectId(userId),
    hasVoted: false,
    joinedAt: new Date(),
  })

  return result.insertedId
}

export async function getRoomParticipants(roomId: string | ObjectId) {
  const { participants, users } = await getCollections()

  const roomParticipants = await participants.find({ roomId: new ObjectId(roomId) }).toArray()

  // Get user details for each participant
  const participantsWithDetails = await Promise.all(
    roomParticipants.map(async (participant) => {
      const user = await users.findOne({ _id: participant.userId })
      return {
        ...participant,
        name: user?.name || "Unknown User",
        email: user?.email,
      }
    }),
  )

  return participantsWithDetails
}

// Helper functions
function generateRoomCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return code
}
