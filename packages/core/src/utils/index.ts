
export function camelToDash(inStr: string) {
  return inStr.replace(/\B([A-Z])/g, '-$1').toLowerCase();
}

export function camelToDashWithSuffix(inStr: string) {
  const strMatched = inStr.match(/^[^_]*/);
  const componentName = strMatched ? strMatched[0] : '';
  const suffix = inStr.replace(componentName, '');
  return camelToDash(componentName) + suffix;
}