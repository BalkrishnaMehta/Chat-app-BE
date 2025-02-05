import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { getRecieverSocketId, io } from "../socket/socket.js";

const prisma = new PrismaClient();

export const chat = async (req: Request, res: Response) => {
  try {
    const { content, receiverId } = req.body;
    const user = req.user as JwtPayload | undefined;

    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message content cannot be empty",
      });
    }

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        error: "Receiver ID is required",
      });
    }

    if (!user?.id) {
      return res.status(401).json({
        success: false,
        error: "User authentication required",
      });
    }

    if (user.id === receiverId) {
      return res.status(400).json({
        success: false,
        error: "Cannot send message to yourself",
      });
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    });

    if (!receiver) {
      return res.status(404).json({
        success: false,
        error: "Receiver not found",
      });
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { has: user.id } },
          { participants: { has: receiverId } },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: [user.id, receiverId],
        },
      });
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId: user.id,
        receiverId,
        conversationId: conversation.id,
      },
      include: {
        sender: {
          select: {
            name: true,
            profilePic: true,
          },
        },
      },
    });

    const receiverSocketId = getRecieverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("message", {
        ...message,
        createdAt: message.createdAt.toISOString(),
      });
    }

    return res.status(200).json(message);
  } catch (error) {
    console.error("Error in chat endpoint:", error);

    if (
      error instanceof Error &&
      error.name === "PrismaClientKnownRequestError"
    ) {
      return res.status(500).json({
        success: false,
        error: "Database error occurred",
      });
    }

    if (error instanceof Error && error.name === "SocketError") {
      return res.status(200).json({
        success: true,
        data: error.message,
        warning: "Message saved but real-time delivery failed",
      });
    }

    return res.status(500).json({
      success: false,
      error: "An internal server error occurred",
    });
  }
};
