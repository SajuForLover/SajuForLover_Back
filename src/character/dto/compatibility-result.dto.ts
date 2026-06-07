export type CompatibilitySections = {
  destiny?: string;
  personality?: string;
  elemental?: string;
  dating?: string;
  growth?: string;
};

export class CompatibilityResultDto {
  characterName?: string;
  fullText?: string;
  sections?: CompatibilitySections;
}
