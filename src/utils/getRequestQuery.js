/**
 * @description get request query from both POST and GET request
 * @param request - request object
 * @returns returns request query
 */
export function getRequestQuery(request) {
  /** @type {Record<string, unknown>} */
  let data = {};
  if (request.body !== undefined) {
    for (let key in request.body) {
      data[key] = request.body[key].value;
    }
  } else {
    for (let key in request.query) {
      data[key] = request.query[key];
    }
  }
  return data;
}
