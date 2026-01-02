import { Step, StepType } from '../types';

interface StepsPanelProps {
  steps: Step[];
}

export default function StepsPanel({ steps }: StepsPanelProps) {
  if (steps.length === 0) {
    return null;
  }

  const getStepIcon = (step: Step) => {
    switch (step.type) {
      case StepType.CreateFile:
        return '📄';
      case StepType.CreateFolder:
        return '📁';
      case StepType.RunScript:
        return '⚡';
      case StepType.EditFile:
        return '✏️';
      default:
        return '📋';
    }
  };

  const getStatusIcon = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return <span className="text-green-500">✓</span>;
      case 'in-progress':
        return <span className="text-yellow-500 animate-pulse">●</span>;
      case 'failed':
        return <span className="text-red-500">✗</span>;
      default:
        return <span className="text-gray-500">○</span>;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0f]">
      <div className="px-2 py-2 border-b border-[#1a1a24]">
        <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
          Steps ({steps.filter(s => s.status === 'completed').length}/{steps.length})
        </h3>
      </div>
      <div className="py-1">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-1.5 px-2 py-1.5 border-b border-[#1a1a24] ${
              step.status === 'completed' ? 'opacity-70' : ''
            }`}
          >
            <span className="text-[10px]">{getStepIcon(step)}</span>
            <span className="text-xs text-gray-300 flex-1 truncate">{step.title}</span>
            <span className="text-xs">{getStatusIcon(step.status)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
