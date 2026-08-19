export const colors = {
  paper: "#F5EEE2",
  paperDeep: "#EDE4D2",
  ink: "#3A3631",
  inkSoft: "#5A544C",
  terracotta: "#C4704A",
  terracottaSoft: "#D9A48F",
  sage: "#7A9B7D",
  sageDeep: "#5F8163",
  dusty: "#7A93A8",
  amber: "#D4A853",
} as const;

export const envConfig = {
  calm: {
    label: "Calm",
    note: "Slower motion, softer palette",
    accent: colors.sage,
  },
  focused: {
    label: "Focused",
    note: "Reduced noise, clear hierarchy",
    accent: colors.terracotta,
  },
  overwhelmed: {
    label: "Overwhelmed",
    note: "Simplified, guided, quiet",
    accent: colors.dusty,
  },
} as const;
