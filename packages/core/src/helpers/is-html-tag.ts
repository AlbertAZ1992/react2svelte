const HTML_TAGS = [
  'div',
  'span',
  'img',
  'input'
];

export default function isHtmlTag(tag: string): boolean {
  return HTML_TAGS.includes(tag);
}