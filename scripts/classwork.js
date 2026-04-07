const cityLocations = {
    berlin: { lat: 52.5244, lon: 13.4105, alt: 43 },
    london: { lat: 51.5074, lon: -0.1278, alt: 35 },
    paris: { lat: 48.8566, lon: 2.3522, alt: 35 },
    'new york': { lat: 40.7128, lon: -74.0060, alt: 10 },
    tokyo: { lat: 35.6895, lon: 139.6917, alt: 40 },
    sydney: { lat: -33.8688, lon: 151.2093, alt: 58 },
    moscow: { lat: 55.7558, lon: 37.6173, alt: 156 },
    cairo: { lat: 30.0444, lon: 31.2357, alt: 23 },
    rio: { lat: -22.9068, lon: -43.1729, alt: 5 }
};

const apiHeaders = {
    'x-rapidapi-key': 'de4c5e2cbamsh1721be6c43315e8p114ee0jsnb52a905c4b81',
    'x-rapidapi-host': 'meteostat.p.rapidapi.com',
    'Content-Type': 'application/json'
};

function showMessage(text, type = 'info') {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = `alert alert-${type}`;
}

function formatValue(value, suffix = '') {
    return value === null || value === undefined ? '—' : `${value}${suffix}`;
}

function formatMonth(record) {
    const monthValue = record.month ?? record.time ?? record.date ?? record.period ?? '';
    if (!monthValue) {
        return 'Unknown';
    }

    const monthString = String(monthValue);
    const match = monthString.match(/^(\d{4})-(\d{2})/);
    if (match) {
        const year = match[1];
        const month = Number(match[2]);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[month - 1] || monthString} ${year}`;
    }

    return monthString;
}

function getVisibleColumns(records) {
    const hasSnow = records.some(record => record.snow !== null && record.snow !== undefined);
    const hasWindDir = records.some(record => record.wdir !== null && record.wdir !== undefined);
    const hasWindSpd = records.some(record => record.wspd !== null && record.wspd !== undefined);
    const hasWindGust = records.some(record => record.wpgt !== null && record.wpgt !== undefined);

    const columns = [
        { label: 'Month', render: record => formatMonth(record) },
        { label: 'Avg Temp', render: record => formatValue(record.tavg, ' °C') },
        { label: 'Min Temp', render: record => formatValue(record.tmin, ' °C') },
        { label: 'Max Temp', render: record => formatValue(record.tmax, ' °C') },
        { label: 'Precip.', render: record => formatValue(record.prcp, ' mm') }
    ];

    if (hasSnow) {
        columns.push({ label: 'Snow', render: record => formatValue(record.snow, ' mm') });
    }
    if (hasWindDir) {
        columns.push({ label: 'Wind Dir', render: record => formatValue(record.wdir, '°') });
    }
    if (hasWindSpd) {
        columns.push({ label: 'Wind Spd', render: record => formatValue(record.wspd, ' km/h') });
    }
    if (hasWindGust) {
        columns.push({ label: 'Wind Gust', render: record => formatValue(record.wpgt, ' km/h') });
    }

    columns.push({ label: 'Pressure', render: record => formatValue(record.pres, ' hPa') });
    return columns;
}

function renderWeatherTable(records) {
    const head = document.getElementById('weatherTableHead');
    const tbody = document.getElementById('weatherTableBody');
    const columns = getVisibleColumns(records);

    head.innerHTML = `<tr>${columns.map(column => `<th>${column.label}</th>`).join('')}</tr>`;
    tbody.innerHTML = records.map(record => `
        <tr>
            ${columns.map(column => `<td>${column.render(record)}</td>`).join('')}
        </tr>
    `).join('');
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function buildApiUrl(location) {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 11);

    const start = formatDate(startDate);
    const end = formatDate(endDate);
    return `https://meteostat.p.rapidapi.com/point/monthly?lat=${location.lat}&lon=${location.lon}&alt=${location.alt}&start=${start}&end=${end}`;
}

function getCityLocation(city) {
    const normalized = city.trim().toLowerCase();
    return cityLocations[normalized];
}

async function fetchWeatherData() {
    const cityInput = document.getElementById('cityInput').value;
    if (!cityInput.trim()) {
        showMessage('Please enter a city name before loading weather data.', 'warning');
        return;
    }

    const location = getCityLocation(cityInput);
    if (!location) {
        showMessage('City not supported. Try Berlin, London, Paris, New York, Tokyo, Sydney, Moscow, Cairo, or Rio.', 'warning');
        return;
    }

    const apiUrl = buildApiUrl(location);
    showMessage(`Loading weather data for ${cityInput.trim()}…`, 'info');

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: apiHeaders
        });

        if (!response.ok) {
            throw new Error(`Request failed (${response.status})`);
        }

        const data = await response.json();

        if (!Array.isArray(data.data) || data.data.length === 0) {
            showMessage('No weather records returned from the API.', 'warning');
            return;
        }

        renderWeatherTable(data.data);
        showMessage(`Loaded ${data.data.length} monthly records for ${cityInput.trim()}.`, 'success');
    } catch (error) {
        console.error(error);
        showMessage(`Error loading weather data: ${error.message}`, 'danger');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loadButton = document.getElementById('loadBtn');
    const cityInput = document.getElementById('cityInput');

    loadButton.addEventListener('click', fetchWeatherData);

    cityInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            fetchWeatherData();
        }
    });
});