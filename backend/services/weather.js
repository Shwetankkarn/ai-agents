async function getWeather(location) {

    const weatherInfo = [];

    for (const { city, date } of location) {

        let url;

        if (date.toLowerCase() === "today") {

            url =
                `http://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${city}&aqi=no`;

        } else if (date.toLowerCase() === "tomorrow") {

            url =
                `http://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${city}&days=2&aqi=no`;

        } else {

            url =
                `http://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${city}&days=7&aqi=no`;
        }

        const response = await fetch(url);

        const data = await response.json();

        weatherInfo.push(data);
    }

    return weatherInfo;
}

export default getWeather;