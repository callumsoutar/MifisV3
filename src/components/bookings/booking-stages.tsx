import React from 'react';
import clsx from 'clsx';

interface Stage {
  key: string;
  label: string;
}

interface BookingStagesProps {
  stages: Stage[];
  currentStage: number; // index of the current stage
  status?: string; // add status prop
}

export function BookingStages({ stages, currentStage, status }: BookingStagesProps) {
  return (
    <div className="w-full flex flex-row items-center justify-between gap-0 select-none" style={{height: 32}}>
      {stages.map((stage, idx) => {
        const isActiveOrComplete = idx <= currentStage;
        const isLast = idx === stages.length - 1;
        // Color logic
        let baseColor = '';
        // Custom: if status is 'flying', make the 'Flying' stage (index 2) solid purple
        if (status === 'flying' && stage.key === 'debrief') {
          baseColor = 'bg-violet-700 text-white';
        } else if (isActiveOrComplete) {
          baseColor = 'bg-violet-600 text-white';
        } else {
          baseColor = 'bg-violet-100 text-violet-600';
        }
        // Chevron shape
        const chevronClip = !isLast
          ? 'polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%, 16px 50%)'
          : 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 16px 50%)';
        return (
          <div
            key={stage.key}
            className={clsx(
              'relative flex items-center justify-center min-w-0 flex-1 h-full transition-colors duration-200',
              baseColor,
              idx === 0 && 'rounded-l-md',
              isLast && 'rounded-r-md',
              'border-none px-0'
            )}
            style={{
              clipPath: chevronClip,
              zIndex: stages.length - idx,
              height: 32,
            }}
          >
            <span className="truncate text-center w-full text-xs font-medium px-2 whitespace-nowrap">
              {stage.label}
            </span>
          </div>
        );
      })}
    </div>
  );
} 