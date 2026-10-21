export {
  CAMELOT_KEYS,
  type CamelotKey,
  type CamelotRelation,
  COMPATIBLE_RELATIONS,
  camelotCode,
  camelotOf,
  camelotRelation,
  isCompatible,
  keyOfCamelot,
  type MixKey,
  mixKeyName,
  sharedNotes,
  wheelSteps,
} from "./camelot.ts";
export { chordTones, chordVoicing, detectChord } from "./chords.ts";
export { chordDegree, romanNumeral, smoothVoicing } from "./harmony.ts";
export { estimateKey, type KeyEstimate, type NoteEvent } from "./keyFinding.ts";
export { fromMidi, pitchClass, toMidi } from "./notes.ts";
export {
  type DegreeChange,
  degreeMidi,
  inScale,
  modeDiff,
  type ScaleDegree,
  scaleDegrees,
  scalePitchClasses,
} from "./scales.ts";
export { STAB_SHAPES, type StabMotion, type StabShape, stabName, stabNotes, stabRootMidi } from "./stabs.ts";
export { optimalProgressionCost, voiceLeadingCost, voicingsInRange } from "./voiceLeading.ts";
