const SORT_NUMBER = (a, b) => Number(a) - Number(b);

export default async function appendDiff(
  previousData,
  newData,
  destinationFileHandler,
) {
  // we calculate the diff between data1.productsIDs and data2.productsIDs
  let previousKeys = Object.keys(previousData.productsIDs).sort(SORT_NUMBER);
  if (!previousData.endOfFile) {
    previousKeys = previousKeys.slice(0, previousKeys.length - 1);
  }
  let newKeys = Object.keys(newData.productsIDs).sort(SORT_NUMBER);
  if (!newData.endOfFile) newKeys = newKeys.slice(0, newKeys.length - 1);
  // if not the end we need to take the biggest common number
  if (!previousData.endOfFile || !newData.endOfFile) {
    let min = Math.min(
      previousKeys[previousKeys.length - 1],
      newKeys[newKeys.length - 1],
    );
    previousKeys = previousKeys.filter((key) => Number(key) <= min);
    newKeys = newKeys.filter((key) => Number(key) <= min);
  }
  let allKeys = previousKeys.slice();
  for (let key of newKeys) {
    if (!allKeys.includes(key)) allKeys.push(key);
  }
  for (let key of allKeys) {
    if (
      !previousData.productsIDs[key] ||
      !newData.productsIDs[key] ||
      previousData.productsIDs[key].sort().join(',') !==
        newData.productsIDs[key].sort().join(',')
    ) {
      let patents = newData.productsIDs[key] || [];
      if (newData.productsIDs[key] && previousData.productsIDs[key]) {
        await destinationFileHandler.write(
          `CHANGE\t${key}\t${patents.join(',')}\n`,
        );
      } else {
        if (newData.productsIDs[key]) {
          await destinationFileHandler.write(
            `ADD\t${key}\t${patents.join(',')}\n`,
          );
        } else {
          await destinationFileHandler.write(
            `DELETE\t${key}\t${patents.join(',')}\n`,
          );
        }
      }
    }
    delete newData.productsIDs[key];
    delete previousData.productsIDs[key];
  }
}
