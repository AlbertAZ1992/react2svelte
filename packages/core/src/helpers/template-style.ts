export default function templateStyle(styleProperties: any[]) {
  return styleProperties.map((styleObject: any) => {
    let key = styleObject.key.name;
    const value = styleObject.value.value;
    key = key.replace(/[A-Z]/g, (v: any) => '-' + v.toLowerCase()).replace(/^(o|moz|webkit)-/g, '-$1-');
    return `${key}:${value}`;
  }).join(';')

//   return Object.keys(styleObject).map((k) => {
//     const value = styleObject[k] || '';
//     const key = k.replace(/[A-Z]/g, (v) => '-' + v.toLowerCase()).replace(/^(o|moz|webkit)-/g, '-$1-');
//     return `${key}:${value}`;
// }).join(';')
}