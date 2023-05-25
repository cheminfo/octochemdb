export function parseHtmlEntities(str) {
  return str.replace(
    /\\u(?<temp2>[\d\w]{4})|&#(?<temp1>[0-9]{1,3});/gi,
    (match, grp1, grp2) => {
      if (grp1) {
        return String.fromCharCode(parseInt(grp1, 16)); //Unicode value with \u it is interpreted as a hexadecimal value
      } else if (grp2) {
        return String.fromCharCode(parseInt(grp2, 10));
      }
    },
  );
}
