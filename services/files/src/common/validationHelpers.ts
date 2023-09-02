export const validateResumeName = async (resumeName: string, hexathonCode?: string) => {
  if (!hexathonCode) return;
  // Check if resume name is in the format <firstName>_<lastName>_<hexathonCode>
  const resumeNameRegex = new RegExp(`^[a-zA-Z]+_[a-zA-Z]+_${hexathonCode.toLowerCase()}.pdf$`);
  if (!resumeNameRegex.test(resumeName)) {
    throw new Error(`Resume not formatted correctly.`);
  }
};
