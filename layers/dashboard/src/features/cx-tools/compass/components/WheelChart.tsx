"use client";
import { useWheel } from "@/features/cx-tools/compass/context/WheelContext";
import { useCompassData } from "@/features/cx-tools/compass/context/CompassDataContext";
import CenterHub from "./CenterHub";
import DomainSlice from "./DomainSlice";
import CauseSlice from "./CauseSlice";
import SignalSlice from "./SignalSlice";
import CompassFrame from "./CompassFrame";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";

const INNER_RADIUS = 135;
const OUTER_RADIUS = 300;
const CAUSE_INNER = 315;
const CAUSE_OUTER = 450;
const SIGNAL_INNER = 450;
const SIGNAL_OUTER = 530;

export default function WheelChart() {
  const { viewState, selectedDomain, selectedCause, setHoveredLabel } = useWheel();
  const { wheelData } = useCompassData();
  const domains = wheelData.domains;
  const domainCount = domains.length;
  const sliceAngle = (Math.PI * 2) / domainCount;

  // Calculate target rotation and zoom container translation
  const { rotation, scale, ty } = useMemo(() => {
    if (viewState === "home" || !selectedDomain) {
      return { rotation: 0, scale: 1, ty: 0 };
    }
    const domainIndex = domains.findIndex((d) => d.id === selectedDomain.id);
    if (domainIndex === -1) {
      return { rotation: 0, scale: 1, ty: 0 };
    }

    const midAngleDeg = ((domainIndex + 0.5) * sliceAngle * 180) / Math.PI;
    // We reverse the old behavior to zoom IN (e.g. 1.25x)
    // and translate it substantially down (ty: 180) to keep the expanded top-slice fully visible in the viewport
    return { rotation: -midAngleDeg, scale: 1.25, ty: 180 };
  }, [viewState, selectedDomain, domains, sliceAngle]);

  return (
    <div
      className="flex items-center justify-center w-full h-full overflow-hidden"
      onMouseLeave={() => setHoveredLabel(null)}
    >
      <motion.div
        className="relative flex items-center justify-center w-full h-full"
        animate={{ scale, y: ty }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <svg
          viewBox="-500 -500 1000 1000"
          className="w-full h-full max-w-[1000px] max-h-[1000px] overflow-visible"
        >
          {/* Wheel Rotation Group using Native CSS */}
          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "0 0",
              transition: "transform 0.6s ease-in-out",
            }}
          >
            {/* The absolute boundary of the Chart is 530, the outermost Compass layer wraps this perfectly */}
            <CompassFrame radius={530} />

            {/* Domain slices */}
            {domains.map((domain, i) => {
              const startAngle = i * sliceAngle;
              const endAngle = (i + 1) * sliceAngle;
              const isSelected = selectedDomain?.id === domain.id;
              const isFaded = viewState !== "home" && !isSelected;

              return (
                <DomainSlice
                  key={domain.id}
                  domain={domain}
                  startAngle={startAngle}
                  endAngle={endAngle}
                  innerRadius={INNER_RADIUS}
                  outerRadius={OUTER_RADIUS}
                  isSelected={isSelected}
                  isFaded={isFaded}
                  wheelRotation={rotation}
                />
              );
            })}

            {/* Cause slices (outer ring) */}
            <AnimatePresence>
              {viewState !== "home" &&
                selectedDomain &&
                (() => {
                  const domainIndex = domains.findIndex((d) => d.id === selectedDomain.id);
                  const domainStartAngle = domainIndex * sliceAngle;
                  const causeCount = selectedDomain.causes.length;
                  const causeSliceAngle = sliceAngle / causeCount;

                  return (
                    <>
                      {/* Render Causes */}
                      {selectedDomain.causes.map((cause, ci) => {
                        const isNotSelectedWhenSignalActive =
                          viewState === "signal" && selectedCause?.id !== cause.id;

                        const cStart = domainStartAngle + ci * causeSliceAngle;
                        const cEnd = domainStartAngle + (ci + 1) * causeSliceAngle;

                        return (
                          <AnimatePresence key={`cause-${cause.id}`}>
                            {!isNotSelectedWhenSignalActive && (
                              <CauseSlice
                                cause={cause}
                                domainColor={selectedDomain.color}
                                startAngle={cStart}
                                endAngle={cEnd}
                                innerRadius={CAUSE_INNER}
                                outerRadius={CAUSE_OUTER}
                                index={ci}
                                wheelRotation={rotation}
                              />
                            )}
                          </AnimatePresence>
                        );
                      })}

                      {/* Render Signals when a cause is selected */}
                      {(viewState === "cause" || viewState === "signal") &&
                        selectedCause &&
                        (() => {
                          const signalCount = selectedCause.signals.length;
                          if (signalCount === 0) return null;

                          // HYBRID EXPANSION: Signals take the FULL domain width
                          const signalSliceAngle = sliceAngle / signalCount;

                          return selectedCause.signals.map((signal, si) => (
                            <SignalSlice
                              key={`signal-${signal.id}`}
                              signal={signal}
                              domainColor={selectedDomain.color}
                              startAngle={domainStartAngle + si * signalSliceAngle}
                              endAngle={domainStartAngle + (si + 1) * signalSliceAngle}
                              innerRadius={SIGNAL_INNER}
                              outerRadius={SIGNAL_OUTER}
                              index={si}
                              wheelRotation={rotation}
                            />
                          ));
                        })()}
                    </>
                  );
                })()}
            </AnimatePresence>
          </g>

          {/* Center Hub stays static and unrotated so text remains upright */}
          <CenterHub />
        </svg>
      </motion.div>
    </div>
  );
}
