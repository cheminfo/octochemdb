export function* taxonomyParser(arrayBuffer) {
  const decoder = new TextDecoder();
  arrayBuffer = new Uint8Array(arrayBuffer);
  let begin = 0;
  let end = 0;
  while (end < arrayBuffer.length) {
    if (arrayBuffer[end] === 10) {
      const line = decoder.decode(arrayBuffer.subarray(begin, end));
      const fields = line.split(/[\t ]*\|[ \t]*/);
      if (fields.length < 2) {
        end++;
        continue;
      }
      const entry = {
        _id: Number(fields[0].replace(/[\r\n]/g, '')),
        organism: fields[1],
        taxonomy: fields[2].split(/; ?/).filter((field) => field),
      };
      yield entry;
      begin = end;
    }
    end++;
  }
  return;
}
