export { chordTones, chordVoicing, detectChord } from "./chords.ts";
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
export { optimalProgressionCost, voiceLeadingCost, voicingsInRange } from "./voiceLeading.ts";
