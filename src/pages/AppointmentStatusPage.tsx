import { useState } from "react";
import AppointmentTimeline from "../components/AppointmentTimeline";

const stages = [
  { id: 'requested', label: 'Requested' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'in_consultation', label: 'In Consultation' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function AppointmentStatusPage() {
  const [currentStage, setCurrentStage] = useState('in_consultation');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-6">Appointment Status</h1>
      <AppointmentTimeline stages={stages} currentStage={currentStage} />
      <div className="mt-8 flex flex-wrap gap-2">
        {stages.map(stage => (
          <button
            key={stage.id}
            onClick={() => setCurrentStage(stage.id)}
            className={`px-3 py-1 rounded text-sm border ${currentStage === stage.id ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600'}`}
          >
            {stage.label}
          </button>
        ))}
      </div>
    </div>
  );
}
