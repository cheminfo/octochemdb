import fetch from 'cross-fetch';

export async function getFragmentNumber() {
  let dataCompound = await fetch(
    'http://127.0.0.1:20822/v1/fromIDCode?idCode=feg%60%60%40D%40%5CdsLjlso%7DkhJRcfuPT%40LAEUA%40%40%40',
  );
  console.log(dataCompound.ok);

  dataCompound = await dataCompound.json();
  console.log(dataCompound);
}

getFragmentNumber();
