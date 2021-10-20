export default function templateStyle(styleProperties: any[]) {
  return `"${styleProperties.map((styleObject: any) => {
    const value = styleObject.value.value;
    const key = styleObject.key.name.replace(/[A-Z]/g, (v: any) => '-' + v.toLowerCase()).replace(/^(o|moz|webkit)-/g, '-$1-');
    return `${key}:${value}`;
  }).join(';')}"`;
}