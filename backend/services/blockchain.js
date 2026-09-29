const coinIds = {
    bitcoin: "bitcoin", btc: "bitcoin", ethereum: "ethereum", eth: "ethereum",
    solana: "solana", sol: "solana", dogecoin: "dogecoin", doge: "dogecoin",
    cardano: "cardano", ada: "cardano", ripple: "ripple", xrp: "ripple",
    "binance coin": "binancecoin", bnb: "binancecoin", "usd coin": "usd-coin", usdc: "usd-coin",
};

async function getCryptoPrice(coin) {
    const normalized = String(coin || "").trim().toLowerCase();
    const id = coinIds[normalized] || normalized.replace(/\s+/g, "-");
    if (!id) throw new Error("A cryptocurrency is required");
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd`, {
        signal: AbortSignal.timeout(12000),
    });
    const data = await response.json();
    if (!response.ok || !data[id]) throw new Error("Cryptocurrency data is unavailable for that asset");
    return data;
}

export default getCryptoPrice;
