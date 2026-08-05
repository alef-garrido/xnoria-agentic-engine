"use client";
import CompassRing from "./CompassRing";
import CompassTicks from "./CompassTicks";
import CompassLabels from "./CompassLabels";
import CompassNeedle from "./CompassNeedle";

interface CompassFrameProps {
  radius: number;
}

export default function CompassFrame({ radius }: CompassFrameProps) {
  return (
    <>
      <CompassRing radius={radius} />
      <CompassTicks radius={radius} />
      <CompassLabels radius={radius} />
      <CompassNeedle radius={radius} />
    </>
  );
}
