export const SCORING = {
  validCallout: 10,          // caller gains, target loses
  unjustCalloutRejected: -8, // caller loses
  unjustCalloutAccepted: 3,  // caller gains partial
  unjustNoReason: -5,        // caller loses
  idleTick: -1,              // target loses per tick of idle beyond threshold
} as const;
