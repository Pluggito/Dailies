import RoomPage from "./RoomPageClient";

export default function ChatroomPage({
  params,
}: {
  params: { roomId: string };
}) {
  return <RoomPage roomId={params.roomId} targetUser={{}} />;
}
