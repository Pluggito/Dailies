"use server"

import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.action"


export async function getNotifications() {
    try {
        const userId = await getDbUserId();
        if (!userId) return [];

        const notifications = await prisma.notification.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    }
                },
                post: {
                    select: {
                        id: true,
                        content: true,
                        image: true,
                    }
                },
                comment: {
                    select: {
                        id: true,
                        content: true,
                        createAt: true, // Note: is this a typo? Should it be 'createdAt'?
                    }
                }
            }
        });

        return notifications;
    } catch (err) {
        console.error('Error fetching notifications:', err);
        throw new Error('Failed to fetch notifications');
    }
}


export async function markNotificationsAsRead(notificationIds: string[]) {
    try{
        await prisma.notification.updateMany({
            where:{
                id:{
                    in: notificationIds,
                }
            },
            data:{
                read: true,
            }
        })

        return{ success:true };
    }catch(err){
        console.error('Error marking notifications as read:', err);
        return{ success: false }

    }
    
}