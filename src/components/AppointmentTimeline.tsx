type Stage = {
  id: string;
  label: string;
};

type AppointmentTimelineProps = {
  stages: Stage[];
  currentStage: string;
};

export default function AppointmentTimeline({ stages, currentStage }: AppointmentTimelineProps) {
  const currentIndex = stages.findIndex(stage => stage.id === currentStage);
  const isCancelled = currentStage === 'cancelled';

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full">
      {stages.map((stage, index) => {
        let status: 'upcoming' | 'active' | 'completed' | 'cancelled' = 'upcoming';

        if (isCancelled) {
          if (stage.id === 'cancelled') status = 'cancelled';
          // all other stages stay 'upcoming' (grey) — appointment was cancelled, not completed
        } else {
          if (index < currentIndex) status = 'completed';
          if (index === currentIndex) status = 'active';
        }

        return (
          <div key={stage.id} className="flex flex-col items-center md:flex-1 relative">
            {/* Dot */}
            <div
              className={`w-6 h-6 rounded-full border-2
                ${status === 'completed' ? 'bg-green-500 border-green-500' : ''}
                ${status === 'active' ? 'bg-blue-500 border-blue-500 animate-pulse' : ''}
                ${status === 'upcoming' ? 'bg-gray-300 border-gray-300' : ''}
                ${status === 'cancelled' ? 'bg-red-500 border-red-500' : ''}
              `}
            />
            {/* Label */}
            <div
              className={`mt-2 text-sm font-medium text-center
                ${status === 'completed' ? 'text-green-600' : ''}
                ${status === 'active' ? 'text-blue-600' : ''}
                ${status === 'upcoming' ? 'text-gray-400' : ''}
                ${status === 'cancelled' ? 'text-red-600 line-through' : ''}
              `}
            >
              {stage.label}
            </div>
            {/* Connecting line — starts from center of this dot, extends to center of next dot */}
            {index < stages.length - 1 && (
              <div
                className={`hidden md:block absolute top-3 left-1/2 w-full h-1 z-0
                  ${index < currentIndex && !isCancelled ? 'bg-green-500' : 'bg-gray-300'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
