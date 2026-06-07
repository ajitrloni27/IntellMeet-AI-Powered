import React from 'react';
import VideoTile from '../meeting/VideoTile';
import type { Participant } from '../../hooks/useWebRTC';

interface VideoGridProps {
  participants: Participant[];
  layout: 'grid' | 'spotlight';
  onPin?: (id: string) => void;
}

export default function VideoGrid({ participants, layout, onPin }: VideoGridProps) {
  if (layout === 'spotlight' && participants.length > 0) {
    // Show first participant as spotlight, others as list
    const [spotlight, ...others] = participants;
    return (
      <div className="flex gap-4 flex-1 overflow-hidden">
        <div className="flex-1 cursor-pointer" onClick={() => onPin && onPin('')}>
          <VideoTile
            stream={spotlight.stream}
            name={spotlight.name}
            muted={spotlight.isLocal}
            isCamOn={spotlight.isLocal ? spotlight.isCamOn : true}
            isMicOn={spotlight.isLocal ? spotlight.isMicOn : true}
            isLocal={spotlight.isLocal}
            isPinned
            onPin={() => onPin && onPin('')}
          />
        </div>
        <div className="flex flex-col gap-3 w-40 overflow-y-auto">
          {others.map(p => (
            <VideoTile
              key={p.id}
              stream={p.stream}
              name={p.name}
              muted={p.isLocal}
              isCamOn={p.isLocal ? p.isCamOn : true}
              isMicOn={p.isLocal ? p.isMicOn : true}
              isLocal={p.isLocal}
              onPin={() => onPin && onPin(p.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Grid layout
  const cols = participants.length <= 2 ? 'grid-cols-2' : participants.length <= 4 ? 'grid-cols-2' : participants.length <= 6 ? 'grid-cols-3' : 'grid-cols-4';
  return (
    <div className={`flex-1 grid ${cols} gap-3 overflow-hidden`}>
      {participants.map(p => (
        <VideoTile
          key={p.id}
          stream={p.stream}
          name={p.name}
          muted={p.isLocal}
          isCamOn={p.isLocal ? p.isCamOn : true}
          isMicOn={p.isLocal ? p.isMicOn : true}
          isLocal={p.isLocal}
          onPin={() => onPin && onPin(p.id)}
        />
      ))}
    </div>
  );
}
