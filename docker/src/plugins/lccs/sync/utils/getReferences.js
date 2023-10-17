import { parseHtmlEntities } from '../../../patents/sync/utils/parseHtmlEntities.js';

export function getReferences(entry) {
  let references = {};
  for (let reference of entry) {
    references[reference.referencenumber] = {};
    if (reference.sourcename !== undefined) {
      references[reference.referencenumber].sourceName = parseHtmlEntities(
        reference.sourcename,
      );
    }
    if (reference.sourceid !== undefined) {
      references[reference.referencenumber].sourceId = reference.sourceid;
    }
    if (reference.url !== undefined) {
      references[reference.referencenumber].url = parseHtmlEntities(
        reference.url,
      );
    }
    if (reference.name !== undefined) {
      references[reference.referencenumber].name = parseHtmlEntities(
        reference.name,
      );
    }
    if (reference.description !== undefined) {
      references[reference.referencenumber].description = parseHtmlEntities(
        reference.description,
      );
    }
  }
  return references;
}
