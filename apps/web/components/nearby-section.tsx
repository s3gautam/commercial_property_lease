import { Bus, Plane, ShoppingBag, TrainFront, Cross, type LucideIcon } from "lucide-react";

import type { ApiNearbyLandmark } from "@/lib/api/types";

const LANDMARK_ICONS: Record<string, LucideIcon> = {
  "Bus Stand": Bus,
  Airport: Plane,
  "Metro Station": TrainFront,
  Hospital: Cross,
  "Shopping Mall": ShoppingBag,
};

export function NearbySection({ landmarks }: { landmarks: ApiNearbyLandmark[] }) {
  if (landmarks.length === 0) return null;

  return (
    <div className="mt-5 rounded-2xl border border-border bg-surface p-6 shadow-soft">
      <h2 className="font-medium">What&apos;s nearby</h2>
      <div className="mt-4 flex flex-col gap-3">
        {landmarks.map((landmark) => {
          const Icon = LANDMARK_ICONS[landmark.label] ?? Bus;
          return (
            <div key={landmark.label} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-accent">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <div>
                  <p className="font-medium">{landmark.label}</p>
                  <p className="text-xs text-muted-foreground">{landmark.name}</p>
                </div>
              </div>
              <span className="shrink-0 font-medium text-muted-foreground">
                {landmark.distance_km} km
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
