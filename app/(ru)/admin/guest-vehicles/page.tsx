import type { Metadata } from "next";
import GuestVehicles from "./guest-vehicles";

export const metadata: Metadata = {
  title: "Гостевые автомобили",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <GuestVehicles />;
}
