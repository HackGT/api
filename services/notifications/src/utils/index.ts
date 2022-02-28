export function flatten(arr: any[]): any[] {
  return arr.reduce(
    (flat, toFlatten) => flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten),
    []
  );
}

export function cleanNumber(numRaw: string) {
  if (numRaw.length < 10) {
    return null;
  }

  const hasCountryCode = numRaw.charAt(0) === "+";
  if (hasCountryCode) {
    const num = numRaw.substring(1).replace(/\D/g, "");
    return `+${num}`;
  }

  const num = numRaw.replace(/\D/g, "");
  return `+1${num}`; // Assume US number
}

export function generateErrorMessage(error: unknown) {
  let message = "Unknown error!";
  if (error instanceof Error) message = error.message;
  return message;
}
