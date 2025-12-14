import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ chatroomId: string }> }) {
    
    const reqParams = await params
    const { chatroomId } = reqParams
    
    const chatRoom = await prisma.chatRoom.findUnique({
        where: {id: chatroomId},
        include: {
            members: {
                include: {user: true}
            }
        }
    })
    
    if(!chatRoom){
        return NextResponse.json({error: "Chat room not found"}, {status: 404})
    }

    return NextResponse.json(chatRoom.members)
}