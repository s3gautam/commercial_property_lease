import {
  Accessibility,
  Bike,
  Building2,
  Camera,
  Coffee,
  Dumbbell,
  Flame,
  ClipboardList,
  Printer,
  ShieldCheck,
  SquareParking,
  Trash2,
  Users,
  Utensils,
  Wifi,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";

const AMENITY_ICONS: Record<string, LucideIcon> = {
  "Reserved parking": SquareParking,
  "High-speed WiFi": Wifi,
  "24/7 power backup": Zap,
  "24/7 security": ShieldCheck,
  "CCTV surveillance": Camera,
  "Central air conditioning": Wind,
  "Conference room": Users,
  "Pantry / cafeteria": Utensils,
  "Elevator access": Building2,
  "Wheelchair accessible": Accessibility,
  "Fire safety system": Flame,
  "Reception desk": ClipboardList,
  "On-site cafe": Coffee,
  "Printer / scanning facility": Printer,
  "Waste disposal service": Trash2,
  "Freight elevator": Building2,
  "Bike parking": Bike,
  "On-site gym": Dumbbell,
};

export function AmenitiesSection({ amenities }: { amenities: string[] }) {
  if (amenities.length === 0) return null;

  return (
    <div className="mt-5 rounded-2xl border border-border bg-surface p-6 shadow-soft">
      <h2 className="font-medium">Amenities</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {amenities.map((amenity) => {
          const Icon = AMENITY_ICONS[amenity] ?? ShieldCheck;
          return (
            <div key={amenity} className="flex items-center gap-2 text-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-accent">
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              {amenity}
            </div>
          );
        })}
      </div>
    </div>
  );
}
