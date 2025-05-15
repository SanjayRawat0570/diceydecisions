import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  name: string
  email: string
  password: string
  createdAt: Date
}

export interface Room {
  _id?: ObjectId
  code: string
  title: string
  description?: string
  maxParticipants?: number
  creatorId: ObjectId | string
  status: "lobby" | "voting" | "completed"
  createdAt: Date
  resolvedAt?: Date
  tiebreaker?: "dice" | "spinner" | "coin" | null
  finalDecision?: string
}

export interface Option {
  _id?: ObjectId
  roomId: ObjectId | string
  text: string
  createdBy: ObjectId | string
  votes: number
}

export interface Participant {
  _id?: ObjectId
  roomId: ObjectId | string
  userId: ObjectId | string
  hasVoted: boolean
  joinedAt: Date
}
