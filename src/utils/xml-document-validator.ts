export function isValidXMLDocument(doc: any): doc is Document {
  return doc && typeof doc.documentElement !== "undefined" && typeof doc.getElementsByTagName === "function";
}
