/**
 * @description get request query from both POST and GET request
 * @param {Object} request - request object
 * @returns {Object} returns request query
 */
export function getRequestQuery(request) {
    let data = {};
    if (request.body !== undefined) {
      for (let key in request.body) {
        data[key] = request.body[key].value;
      }
    } else{
      for (let key in request.query) {
        data[key] = request.query[key];
      }
    }
    return data;
  }