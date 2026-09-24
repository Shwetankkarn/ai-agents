async function getCryptoPrice(coin){

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`;

  const response= await fetch(url);

  const data= await response.json();

  return data;


}

export default getCryptoPrice;