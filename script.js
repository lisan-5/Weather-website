const cityInput = document.querySelector('.city-input')
const searchBtn = document.querySelector('.search-btn')

const weatherInfoSection = document.querySelector('.weather-info')
const notFoundSection = document.querySelector('.not-found')
const searchCitySection = document.querySelector('.search-city')

const countryTxt = document.querySelector('.country-txt')
const tempTxt = document.querySelector('.temp-txt')
const conditionTxt = document.querySelector('.condition-txt')
const humidityValueTxt = document.querySelector('.humidity-value-txt')
const windValueTxt = document.querySelector('.wind-value-txt')
const weatherSummaryImg = document.querySelector('.weather-summary-img')
const currentDateTxt = document.querySelector('.current-date-txt')
const pressureValueTxt = document.querySelector('.pressure-value-txt')
const visibilityValueTxt = document.querySelector('.visibility-value-txt')

const forecastItemsContainer = document.querySelector('.forecast-items-container')

const apiKey = '8e4f5e55b5b407a1e43e1f1f7c23be84' //API key

const logo = document.querySelector('.logo');

logo.addEventListener('click', () => {
    logo.style.animation = 'bounce 2s infinite';
    logo.addEventListener('animationend', () => {
        logo.style.animation = ''; // Reset animation
        location.reload(); // Reload the page
    }, { once: true });
});

// Select the existing geolocation button
const geolocationBtn = document.querySelector('.geolocation-btn');

const loadingSpinner = document.getElementById('loading-spinner');

function showLoadingSpinner() {
    loadingSpinner.style.display = 'block';
}

function hideLoadingSpinner() {
    loadingSpinner.style.display = 'none';
}

geolocationBtn.addEventListener('click', () => {
    showLoadingSpinner();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const weatherData = await getWeatherByCoordinates(latitude, longitude);
            hideLoadingSpinner();
            if (weatherData) {
                updateWeatherInfoByData(weatherData);
                document.getElementById('suggestions-container').innerHTML = ''; // Clear suggestions
            }
        }, (error) => {
            hideLoadingSpinner();
            console.error('Error getting location:', error);
        });
    } else {
        hideLoadingSpinner();
        console.error('Geolocation is not supported by this browser.');
    }
});

async function getWeatherByCoordinates(lat, lon) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const response = await fetch(apiUrl);
    if (response.ok) {
        return response.json();
    } else {
        console.error('Error fetching weather data:', response.statusText);
        return null;
    }
}

function updateWeatherInfoByData(weatherData) {
    const {
        name: country,
        main: { temp, humidity, pressure },
        weather: [{ id, main }],
        wind: { speed },
        visibility,
        coord: { lat, lon }
    } = weatherData;

    cityCoordinates.lat = lat;
    cityCoordinates.lon = lon;

    countryTxt.textContent = country;
    tempTxt.textContent = formatTemperature(temp);
    conditionTxt.textContent = getTranslatedCondition(main);
    humidityValueTxt.textContent = humidity + '%';
    windValueTxt.textContent = speed + ' M/s';
    pressureValueTxt.textContent = pressure + ' hPa';
    visibilityValueTxt.textContent = (visibility / 1000).toFixed(1) + ' km';

    currentDateTxt.textContent = getCurrentDate();
    weatherSummaryImg.src = `assets/weather/${getWeatherIcon(id)}`;

    updateTheme(temp); // Update theme based on temperature

    showDisplaySection(weatherInfoSection);

    document.querySelector('.unit-toggle-btn').style.display = 'inline-block';
    document.querySelector('.switch').style.display = 'inline-block';
}

let debounceTimeout;
cityInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
        const query = cityInput.value.trim();
        if (query.length > 2) {
            const suggestions = await fetchCitySuggestions(query);
            displaySuggestions(suggestions);
        }
    }, 150); // Reduce debounce delay for faster response
});

async function fetchCitySuggestions(query) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/find?q=${query}&appid=${apiKey}&type=like&sort=population&cnt=10`; // Increased cnt from 5 to 10
    const response = await fetch(apiUrl);
    const data = await response.json();
    const uniqueCities = new Map();
    data.list.forEach(city => {
        if (!uniqueCities.has(city.name)) {
            uniqueCities.set(city.name, city.sys.country);
        }
    });
    return Array.from(uniqueCities).map(([name, country]) => ({ name, country }));
}

function displaySuggestions(suggestions) {
    const suggestionsContainer = document.getElementById('suggestions-container');
    suggestionsContainer.innerHTML = ''; // Clear previous suggestions

    suggestions.forEach(({ name, country }) => {
        const suggestionItem = document.createElement('div');
        suggestionItem.classList.add('suggestion-item');
        suggestionItem.textContent = `${name}, ${country}`;
        suggestionItem.addEventListener('click', () => {
            cityInput.value = name;
            suggestionsContainer.innerHTML = ''; // Clear suggestions
            updateWeatherInfo(name);
        });
        suggestionsContainer.appendChild(suggestionItem);
    });
}

// Hide suggestions when clicking outside
document.addEventListener('click', (event) => {
    if (!event.target.closest('.input-container')) {
        document.getElementById('suggestions-container').innerHTML = '';
    }
});

searchBtn.addEventListener('click', () => {
    const query = cityInput.value.trim();
    if (query !== '') {
        updateWeatherInfo(query);
        cityInput.value = '';
        document.getElementById('suggestions-container').innerHTML = ''; // Clear suggestions
        cityInput.blur();
    }
});

cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const query = cityInput.value.trim();
        if (query !== '') {
            updateWeatherInfo(query);
            cityInput.value = '';
            document.getElementById('suggestions-container').innerHTML = ''; // Clear suggestions
            cityInput.blur();
        }
    }
});

async function getFetchData(endPoint, city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${city}&appid=${apiKey}&units=metric`

    const response = await fetch(apiUrl)
    
    return response.json()
}

// Fix the function name from getWeaatherIcon to getWeatherIcon
function getWeatherIcon(id) {
    if (id <= 232) return 'thunderstorm.svg'
    if (id <= 321) return 'drizzle.svg'
    if (id <= 531) return 'rain.svg'
    if (id <= 622) return 'snow.svg'
    if (id <= 781) return 'atmosphere.svg'
    if (id <= 800) return 'clear.svg'
    else return 'clouds.svg'
}

function getCurrentDate() {
    const currentDate = new Date()
    const options = {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    }
    
    return currentDate.toLocaleDateString(currentLanguage === 'am' ? 'am-ET' : currentLanguage, options)
}

let cityCoordinates = { lat: null, lon: null }; // Store city coordinates

let isCelsius = true;

const unitToggleCheckbox = document.querySelectorAll('.unit-toggle-checkbox');
unitToggleCheckbox.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        isCelsius = !isCelsius;
        const currentTemp = parseFloat(tempTxt.textContent);
        const newTemp = isCelsius ? convertTemperature(currentTemp, true) : convertTemperature(currentTemp, false);
        tempTxt.textContent = formatTemperature(newTemp);
        updateForecastTemperatures();
    });
});

function convertTemperature(temp, toCelsius) {
    return toCelsius ? (temp - 32) * 5 / 9 : (temp * 9 / 5) + 32;
}

function formatTemperature(temp) {
    return isCelsius ? `${Math.round(temp)} °C` : `${Math.round(temp)} °F`;
}

function updateForecastTemperatures() {
    document.querySelectorAll('.forecast-item-temp').forEach(tempElement => {
        const currentTemp = parseFloat(tempElement.textContent);
        const newTemp = isCelsius ? convertTemperature(currentTemp, true) : convertTemperature(currentTemp, false);
        tempElement.textContent = formatTemperature(newTemp);
    });
}

async function updateWeatherInfo(city) {
    showLoadingSpinner();
    const weatherData = await getFetchData('weather', city);
    hideLoadingSpinner();
    
    if (weatherData.cod != 200) {
        showDisplaySection(notFoundSection);
        return;
    }
    
    const {
        name: country,
        main: { temp, humidity, pressure },
        weather: [{ id, main }],
        wind: { speed },
        visibility,
        coord: { lat, lon } // Extract coordinates
    } = weatherData;

    cityCoordinates.lat = lat; // Store latitude
    cityCoordinates.lon = lon; // Store longitude

    countryTxt.textContent = country;
    tempTxt.textContent = formatTemperature(temp);
    conditionTxt.textContent = getTranslatedCondition(main);
    humidityValueTxt.textContent = humidity + '%';
    windValueTxt.textContent = speed + ' M/s';
    pressureValueTxt.textContent = pressure + ' hPa';
    visibilityValueTxt.textContent = (visibility / 1000).toFixed(1) + ' km';

    currentDateTxt.textContent = getCurrentDate();
    weatherSummaryImg.src = `assets/weather/${getWeatherIcon(id)}`;

    updateTheme(temp); // Update theme based on temperature

    await updateForecastsInfo(city);
    showDisplaySection(weatherInfoSection);

    // Show the unit toggle button
    document.querySelector('.unit-toggle-btn').style.display = 'inline-block';
    document.querySelector('.switch').style.display = 'inline-block';
}

// Add event listener to the location icon
const locationIcon = document.querySelector('.location .material-symbols-outlined')
locationIcon.addEventListener('click', () => {
    if (cityCoordinates.lat && cityCoordinates.lon) {
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${cityCoordinates.lat},${cityCoordinates.lon}`
        window.open(googleMapsUrl, '_blank')
    }
})

// Add event listener to the country text
const locationName = document.querySelector('.country-txt');

locationName.addEventListener('click', () => {
    if (cityCoordinates.lat && cityCoordinates.lon) {
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${cityCoordinates.lat},${cityCoordinates.lon}`;
        window.open(googleMapsUrl, '_blank');
    }
});

async function updateForecastsInfo(city) {
    const forecastsData = await getFetchData('forecast', city);

    const todayDate = new Date().toISOString().split('T')[0];

    forecastItemsContainer.innerHTML = '';
    const dailyForecasts = {};

    forecastsData.list.forEach(forecastWeather => {
        const date = forecastWeather.dt_txt.split(' ')[0];
        if (!dailyForecasts[date]) {
            dailyForecasts[date] = [];
        }
        dailyForecasts[date].push(forecastWeather);
    });

    Object.keys(dailyForecasts).forEach(date => {
        const dailyData = dailyForecasts[date];
        const avgTemp = dailyData.reduce((sum, weather) => sum + weather.main.temp, 0) / dailyData.length;
        const weatherId = dailyData[0].weather[0].id;
        updateForecastItems(date, avgTemp, weatherId);
    });
}

function updateForecastItems(date, avgTemp, weatherId) {
    const dateTaken = new Date(date);
    const dateOption = {
        weekday: 'short', // Corrected to show the day of the week
        day: '2-digit',
        month: 'short'
    };
    const dateResult = dateTaken.toLocaleDateString('en-US', dateOption);

    const forecastItem = `
        <div class="forecast-item">
            <h5 class="forecast-item-date regular-txt">${dateResult}</h5>
            <img src="assets/weather/${getWeatherIcon(weatherId)}" class="forecast-item-img">
            <h5 class="forecast-item-temp">${formatTemperature(avgTemp)}</h5>
        </div>
    `;

    forecastItemsContainer.insertAdjacentHTML('beforeend', forecastItem);
}

function updateTodayForecast(avgTemp, weatherId) {
    tempTxt.textContent = formatTemperature(avgTemp);
    weatherSummaryImg.src = `assets/weather/${getWeatherIcon(weatherId)}`;
}

function showDisplaySection(section) {
    [weatherInfoSection, searchCitySection, notFoundSection]
        .forEach(sec => sec.style.display = 'none');

    section.style.display = 'flex';

    geolocationBtn.style.display = 'flex';

    // Hide the logo when weatherInfoSection is displayed
    if (section === weatherInfoSection) {
        logo.style.display = 'none';
    } else {
        logo.style.display = 'flex';
    }
}

// Ensure suggestionTxt is visible in mobile view
window.addEventListener('resize', () => {
    if (window.innerWidth <= 480) {
        suggestionTxt.style.display = 'block';
    } else {
        suggestionTxt.style.display = 'none';
    }
});

// Listen for window resize to handle dynamic changes
window.addEventListener('resize', () => {
    if (weatherInfoSection.style.display === 'flex') {
        logo.style.display = 'none';
    } else {
        logo.style.display = 'flex';
    }
});

function updateTheme(temp) {
    const mainContainer = document.querySelector('.main-container');
    mainContainer.classList.remove('theme-cold', 'theme-mild', 'theme-warm', 'theme-hot');

    if (temp <= 10) {
        mainContainer.classList.add('theme-cold');
    } else if (temp <= 20) {
        mainContainer.classList.add('theme-mild');
    } else if (temp <= 30) {
        mainContainer.classList.add('theme-warm');
    } else {
        mainContainer.classList.add('theme-hot');
    }
}

// Language dictionary with translations
const translations = {
    en: {
        searchPlaceholder: "Search City",
        humidity: "Humidity",
        windSpeed: "Wind Speed",
        pressure: "Pressure",
        visibility: "Visibility",
        searchTitle: "Search Anywhere",
        searchDescription: "Find out weather conditions of cities around the world",
        notFoundTitle: "Not Found",
        notFoundDescription: "The location you are looking for cannot be found, sorry.",
        conditions: {
            Clouds: "Clouds",
            Clear: "Clear",
            Rain: "Rain",
            Snow: "Snow",
            Drizzle: "Drizzle",
            Thunderstorm: "Thunderstorm",
            Mist: "Mist",
            Smoke: "Smoke",
            Haze: "Haze",
            Dust: "Dust",
            Fog: "Fog",
            Sand: "Sand",
            Ash: "Ash",
            Squall: "Squall",
            Tornado: "Tornado"
        },
        logoText: "Ligator",
        footerText: "© 2024 Lisanegebriel Abay Kebedew. All Rights Reserved."
    },
    es: {
        searchPlaceholder: "Buscar Ciudad",
        humidity: "Humedad",
        windSpeed: "Velocidad del Viento",
        pressure: "Presión",
        visibility: "Visibilidad",
        searchTitle: "Buscar en Cualquier Lugar",
        searchDescription: "Descubre el estado del tiempo de ciudades alrededor del mundo.",
        notFoundTitle: "No Encontrado",
        notFoundDescription: "No se puede encontrar la ubicación que buscas, lo siento.",
        conditions: {
            Clouds: "Nubes",
            Clear: "Despejado",
            Rain: "Lluvia",
            Snow: "Nieve",
            Drizzle: "Llovizna",
            Thunderstorm: "Tormenta",
            Mist: "Neblina",
            Smoke: "Humo",
            Haze: "Bruma",
            Dust: "Polvo",
            Fog: "Niebla",
            Sand: "Arena",
            Ash: "Ceniza",
            Squall: "Chubasco",
            Tornado: "Tornado"
        },
        logoText: "Ligator",
        footerText: "© 2024 Lisanegebriel Abay Kebedew. Todos los derechos reservados."
    },
    fr: {
        searchPlaceholder: "Rechercher une ville",
        humidity: "Humidité",
        windSpeed: "Vitesse du Vent",
        pressure: "Pression",
        visibility: "Visibilité",
        searchTitle: "Rechercher N'importe Où",
        searchDescription: "Découvrez les conditions météorologiques des villes du monde entier.",
        notFoundTitle: "Introuvable",
        notFoundDescription: "L'emplacement que vous recherchez est introuvable, désolé.",
        conditions: {
            Clouds: "Nuages",
            Clear: "Clair",
            Rain: "Pluie",
            Snow: "Neige",
            Drizzle: "Bruine",
            Thunderstorm: "Orage",
            Mist: "Brume",
            Smoke: "Fumée",
            Haze: "Brume légère",
            Dust: "Poussière",
            Fog: "Brouillard",
            Sand: "Sable",
            Ash: "Cendres",
            Squall: "Grain",
            Tornado: "Tornade"
        },
        logoText: "Ligator",
        footerText: "© 2024 Lisanegebriel Abay Kebedew. Tous droits réservés."
    },
    am: {
        searchPlaceholder: "ከተማ ይፈልጉ",
        humidity: "እርጥበት",
        windSpeed: "የነፋስ ፍጥነት",
        pressure: "��ፊት",
        visibility: "የማይታየት",
        searchTitle: "የትም ፈልግ",
        searchDescription: "የዓለም ሁሉ ከተሞች የአየር ሁኔታ ሁኔታን አውቃ.",
        notFoundTitle: "አልተገኘም",
        notFoundDescription: "የምትፈልገው ቦታ አይገኝም፣ እባክዎን ይቅርታ.",
        conditions: {
            Clouds: "ደመናዎች",
            Clear: "ነጭ",
            Rain: "ዝናብ",
            Snow: "ሰንደቅ",
            Drizzle: "በጥቅምት",
            Thunderstorm: "ነጎድጓድ",
            Mist: "ጭጋግ",
            Smoke:  "ጢስ",
            Haze: "ጭረት",
            Dust: "አጓሎ",
            Fog: "ጭጋግ",
            Sand: "በረሃ",
            Ash: "ጋጠቶ",
            Squall: "ነፋስ",
            Tornado: "የአውሎ ነፋስ"
        },
        logoText: "ሊጌተር",
        footerText: "© 2024 ልሳነግብርኤግዚአብሔር አባይ ከበደ። መብት በሙሉ የተተወ።"
    },
    ti: {
        searchPlaceholder: "ከተማ ይፈልጉ",
        humidity: "እርጥበት",
        windSpeed: "የነፋስ ፍጥነት",
        pressure: "ግፊት",
        visibility: "መታየት",
        searchTitle: "የትም ፈልግ",
        searchDescription: "የዓለም ከተሞች የአየር ሁኔታን ያግኙ",
        notFoundTitle: "አልተገኘም",
        notFoundDescription: "ያስፈልጉት ቦታ ሊገኝ አልቻለም፣ ይቅርታ።",
        conditions: {
            Clouds: "ደመና",
            Clear: "ፀደይ",
            Rain: "ዝናብ",
            Snow: "በረዶ",
            Drizzle: "በጥም",
            Thunderstorm: "ነጎድጓድ",
            Mist: "ጭጋግ",
            Smoke: "ጢስ",
            Haze: "ጭረት",
            Dust: "አጓሎ",
            Fog: "ጭጋግ",
            Sand: "አሸዋ",
            Ash: "ዐመድ",
            Squall: "ድንጋጤ ነፋስ",
            Tornado: "የአውሎ ነፋስ"
        },
        logoText: "ሊጌተር",
        footerText: "© 2024 ሊሳነገብርኤል አባይ ከበደ። ሁሉም መብቶች ተጠበቁ።"
    },
    om: {
        searchPlaceholder: "Magaalaa Barbaadi",
        humidity: "Dheekkamsa Qilleensaa",
        windSpeed: "Saffisa Fuula Qilleensaa",
        pressure: "Dhiibbaan Qilleensaa",
        visibility: "Mul'ataa",
        searchTitle: "Iddoo Hunda Barbaadi",
        searchDescription: "Haala qilleensa magaalaalee addunyaa beeki",
        notFoundTitle: "Hin Argamne",
        notFoundDescription: "Iddoon barbaadame hin argamne, dhiifama.",
        conditions: {
            Clouds: "Megaalee",
            Clear: "Ifaa",
            Rain: "Rooba",
            Snow: "Cilee",
            Drizzle: "Daannoo",
            Thunderstorm: "Gubbaa",
            Mist: "Hazoona",
            Smoke: "Ko'oomaa",
            Haze: "Daannoo",
            Dust: "Tuuta",
            Fog: "Hazoona",
            Sand: "Zalaala",
            Ash: "Dhoolla",
            Squall: "Furtuu Qilleensaa",
            Tornado: "Mudduuwa"
        },
        logoText: "Ligator",
        footerText: "© 2024 Lisanegebriel Abay Kebedew. Mirga Hundaa Eegame."
    }
};

// Current language
let currentLanguage = 'en';

// Language selector
const languageSelector = document.getElementById('language-selector');
languageSelector.addEventListener('change', () => {
    currentLanguage = languageSelector.value;
    updateLanguage();
    // Update weather info to reflect new language
    if (cityInput.value.trim() !== '') {
        updateWeatherInfo(cityInput.value.trim());
    }
});

// Function to update text content based on current language
function updateLanguage() {
    cityInput.placeholder = translations[currentLanguage].searchPlaceholder;
    document.getElementById('humidity-label').textContent = translations[currentLanguage].humidity;
    document.getElementById('wind-speed-label').textContent = translations[currentLanguage].windSpeed;
    document.getElementById('pressure-label').textContent = translations[currentLanguage].pressure;
    document.getElementById('visibility-label').textContent = translations[currentLanguage].visibility;
    document.getElementById('search-title').textContent = translations[currentLanguage].searchTitle;
    document.getElementById('search-description').textContent = translations[currentLanguage].searchDescription;
    document.getElementById('not-found-title').textContent = translations[currentLanguage].notFoundTitle;
    document.getElementById('not-found-description').textContent = translations[currentLanguage].notFoundDescription;
    document.getElementById('logo-text').textContent = translations[currentLanguage].logoText;
    document.getElementById('footer-text').textContent = translations[currentLanguage].footerText;
    // Update the date format
    currentDateTxt.textContent = getCurrentDate();
}

// Modify getCurrentDate to respect the selected language
function getCurrentDate() {
    const currentDate = new Date();
    const options = {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    };
    return currentDate.toLocaleDateString(currentLanguage === 'am' ? 'am-ET' : currentLanguage, options);
}

// Update weather condition text to use translations
function getTranslatedCondition(condition) {
    return translations[currentLanguage].conditions[condition] || condition;
}

// Update weather info function to use translated text
function updateWeatherInfoByData(weatherData) {
    const {
        name: country,
        main: { temp, humidity, pressure },
        weather: [{ id, main }],
        wind: { speed },
        visibility,
        coord: { lat, lon }
    } = weatherData;

    cityCoordinates.lat = lat;
    cityCoordinates.lon = lon;

    countryTxt.textContent = country;
    tempTxt.textContent = formatTemperature(temp);
    conditionTxt.textContent = getTranslatedCondition(main);
    humidityValueTxt.textContent = humidity + '%';
    windValueTxt.textContent = speed + ' M/s';
    pressureValueTxt.textContent = pressure + ' hPa';
    visibilityValueTxt.textContent = (visibility / 1000).toFixed(1) + ' km';

    currentDateTxt.textContent = getCurrentDate();
    weatherSummaryImg.src = `assets/weather/${getWeatherIcon(id)}`;

    updateTheme(temp); // Update theme based on temperature

    showDisplaySection(weatherInfoSection);

    document.querySelector('.unit-toggle-btn').style.display = 'inline-block';
    document.querySelector('.switch').style.display = 'inline-block';
}

// Make sure to call updateLanguage on page load
updateLanguage();