"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = {
  id: number;
  title: string;
  description: string;
};

type Props = {
  currentStep: number;
  steps?: Step[];
};

const defaultSteps: Step[] = [
  { id: 1, title: "Select member", description: "Choose an existing member or create one." },
  { id: 2, title: "Pastor profile", description: "Set title, ordination date, and bio." },
  { id: 3, title: "Branch assignments", description: "Assign this pastor to branches." }
];

export function PastorStepper({ currentStep, steps = defaultSteps }: Props) {
  return (
    <ol className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
      {steps.map((step, index) => {
        const isActive = currentStep === step.id;
        const isComplete = step.id < currentStep;
        return (
          <li key={step.id} className="flex flex-1 gap-4">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold",
                isComplete && "border-primary bg-primary text-primary-foreground",
                isActive && !isComplete && "border-primary text-primary"
              )}
            >
              {isComplete ? <Check className="h-5 w-5" /> : step.id}
            </div>
            <div className="space-y-1">
              <p className="font-semibold">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.description}</p>
              {index < steps.length - 1 && <div className="mt-3 hidden h-px flex-1 bg-border md:block" />}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
