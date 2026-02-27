import React, { useEffect, useState, lazy, Suspense } from "react";
import { videoCallAPI } from "@/lib/services";

const VideoCall = lazy(() => import("../components/VideoCall"));

const StartCall: React.FC = () => {
  const [meetingId, setMeetingId] = useState<string>("");
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const getRoom = async () => {
      try {
        const res = await videoCallAPI.getMeetingToken();
        setMeetingId(res.data.roomId);
        setToken(res.data.token);
      } catch (err) {
        console.error("Error getting meeting token", err);
      }
    };

    getRoom();
  }, []);

  return meetingId && token ? (
    <Suspense fallback={<div className="text-center mt-10 text-xl">🔄 Loading Video Call...</div>}>
      <VideoCall meetingId={meetingId} token={token} name="Dr. Vasu" />
    </Suspense>
  ) : (
    <div className="text-center mt-10 text-xl">🔄 Starting Video Call...</div>
  );
};

export default StartCall;