async function getWeather(location) {

    const weatherInfo = [];

    for (const { city, date } of location) {

        let url;

        const normalizedDate = (date || "today").toLowerCase();

        if (normalizedDate === "today") {

            url =
                `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${encodeURIComponent(city)}&aqi=no`;

        } else if (normalizedDate === "tomorrow") {

            url =
                `https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${encodeURIComponent(city)}&days=2&aqi=no`;

        } else {

            url =
                `https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${encodeURIComponent(city)}&days=7&aqi=no`;
        }

        const response = await fetch(url, { signal: AbortSignal.timeout(12000) });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || "Weather service request failed");
        }

        weatherInfo.push(data);
    }

    return weatherInfo;
}

export default getWeather;
