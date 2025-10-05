import { createOrGetChatroom } from "@/actions/chatroom.action"
import { getDbUserId, getUserByUsername} from "@/actions/user.action"
import { redirect } from "next/navigation"

export default async function ChatRoomServer({ params }: { params: { username: string } }) {
  const { username } = params

  // Get target user by username from URL
  const targetUser = await getUserByUsername(username)
  if (!targetUser) return <div>User not found</div>

  // Get currently logged-in user ID
  const currentUserId = await getDbUserId()
  if (!currentUserId) redirect('/login')

  // Prevent self-chat
  if (currentUserId === targetUser.id) return <div>You can&#39;t chat with yourself</div>

  // Redirect to existing or newly created chatroom
  const roomId = await createOrGetChatroom(currentUserId, targetUser.id);

  redirect(`/chatroom/${roomId}`);

  return null // Optional: show a loading spinner here
}
