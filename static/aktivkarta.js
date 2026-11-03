const map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [17.3147, 62.3898],
    zoom: 14,
    attributionControl: false
});

const fallbackCenter = [17.3147, 62.3898];

let userLocation = null;
let userMarker = null;
map.addControl(
    new maplibregl.AttributionControl({
        compact: true,
        customAttribution:
            '© OpenFreeMap · © OpenStreetMap contributors'
    }),
    'bottom-right'
);
map.addControl(
    new maplibregl.NavigationControl(),
    'top-right'
);

map.on('error', (e) => console.error('Kartfel:', e.error));

map.on('load', () => {
    // Style the map layers
    const style = map.getStyle();
    if (style.layers) {
        style.layers.forEach(layer => {
            const id = layer.id;
            try {
                if (layer.type === 'line' &&
                    (id.includes('road') || id.includes('street') || id.includes('highway'))) {
                    map.setPaintProperty(layer.id, 'line-color', '#d8dde0');
                    map.setPaintProperty(layer.id, 'line-opacity', 0.75);
                }
                if (layer.type === 'fill' &&
                    (id.includes('park') || id.includes('landuse') || id.includes('green'))) {
                    map.setPaintProperty(layer.id, 'fill-color', '#edf4ef');
                    map.setPaintProperty(layer.id, 'fill-opacity', 0.8);
                }
                if (layer.type === 'fill' &&
                    (id.includes('water') || id.includes('ocean') || id.includes('lake'))) {
                    map.setPaintProperty(layer.id, 'fill-color', '#edf7f8');
                    map.setPaintProperty(layer.id, 'fill-opacity', 0.9);
                }
                if (layer.type === 'fill' && id.includes('building')) {
                    map.setPaintProperty(layer.id, 'fill-color', '#f8f8f6');
                    map.setPaintProperty(layer.id, 'fill-opacity', 0.85);
                }
            } catch (e) {
                console.log('Kunde inte styla:', layer.id);
            }
        });
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                console.log('Geolocation OK:', { userLng, userLat });
                map.flyTo({
                    center: [userLng, userLat],
                    zoom: 14
                });

                addUserMarker(userLng, userLat);
            },
            (error) => {
                console.warn('Geolocation misslyckades:', error.code, error.message);

                // Endast om platsen faktiskt inte går att hämta
                map.flyTo({
                    center: fallbackCenter,
                    zoom: 12
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        console.error('Geolocation stöds inte i denna webbläsare');
    }
});

function addMarker(longitude, latitude, title, description) {
    const element = document.createElement('div');
    element.className = 'custom-marker';

    const markerCard = document.createElement('div');
    markerCard.className = 'marker-card';

    const markerIcon = document.createElement('div');
    markerIcon.className = 'marker-icon';
    markerIcon.textContent = '★';

    const markerContent = document.createElement('div');
    markerContent.className = 'marker-content';

    const markerTitle = document.createElement('strong');
    markerTitle.className = 'marker-title';
    markerTitle.textContent = title;

    const markerDescription = document.createElement('span');
    markerDescription.className = 'marker-description';
    markerDescription.textContent = description;

    markerContent.append(markerTitle, markerDescription);
    markerCard.append(markerIcon, markerContent);
    element.appendChild(markerCard);

    const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(`
            <strong>${title}</strong>
            <p>${description}</p>
        `);

    new maplibregl.Marker({
        element: element,
        anchor: 'bottom'
    })
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(map);
}

function addUserMarker(longitude, latitude) {
    if (userMarker) {
        userMarker.setLngLat([longitude, latitude]);
        return;
    }

    const element = document.createElement('div');
    element.className = 'user-marker';

    const popup = new maplibregl.Popup({ offset: 18 })
        .setHTML('<strong>Din plats</strong>');

    userMarker = new maplibregl.Marker({ element })
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(map);
}

// Every activity marker on the map (and its card in the feed), used by the search.
const activityMarkers = [];

function addActivityMarker(activity) {
    const markerElement = document.createElement('div');
    markerElement.className = `location-marker ${getCategoryClass(
        activity.category
    )}`;

    // Image used inside the map marker.
    const markerImage = document.createElement('img');
    markerImage.className = 'location-marker-image';
    markerImage.src = activity.markerImage;
    markerImage.alt = `${activity.category} ikon`;

    markerElement.appendChild(markerImage);

    const popupContent = document.createElement('div');
    popupContent.className = 'activity-popup';

    // Separate image used inside the popup.
    const popupImage = document.createElement('img');
    popupImage.className = 'activity-image';
    popupImage.src = activity.image;
    popupImage.alt = activity.title;

    const category = document.createElement('span');
    category.className = 'activity-category';
    category.textContent = activity.category;

    const title = document.createElement('h3');
    title.className = 'activity-title';
    title.textContent = activity.title;

    const description = document.createElement('p');
    description.className = 'activity-description';
    description.textContent = activity.description;

    const details = document.createElement('div');
    details.className = 'activity-details';
    details.innerHTML = `
        <span>📅 ${activity.date}</span>
        <span>⏰ ${activity.time}</span>
        <span>📍 ${activity.location}</span>
    `;

    const button = document.createElement('button');
    button.className = 'activity-button';
    button.textContent = 'Visa aktivitet';

    button.addEventListener('click', () => {
        console.log(`Valde aktivitet: ${activity.title}`);
    });

    popupContent.append(
        popupImage,
        category,
        title,
        description,
        details,
        button
    );

    const popup = new maplibregl.Popup({
        offset: 20,
        maxWidth: '320px'
    }).setDOMContent(popupContent);

    const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: 'bottom'
    })
        .setLngLat([activity.longitude, activity.latitude])
        .setPopup(popup)
        .addTo(map);

    // Build the card in the feed next to the map.
    const card = createActivityCard(activity, marker);
    document.getElementById('activity-list').appendChild(card);

    // Highlight the card while its popup is open.
    popup.on('open', () => card.classList.add('is-selected'));
    popup.on('close', () => card.classList.remove('is-selected'));

    // Save the marker and card so the search can show/hide them.
    activityMarkers.push({ activity, marker, card });

    updateDistances();
    updateFeedCount();
}

/* ---------- Aktivitetskort ---------- */
const ICON_CALENDAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"></rect><path d="M8 3v4M16 3v4M3 10h18"></path></svg>';
const ICON_PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"></path><circle cx="12" cy="9.5" r="2.5"></circle></svg>';

function getChipClass(category) {
    const chipClasses = {
        Sport: 'chip-sport',
        Kultur: 'chip-kultur',
        Natur: 'chip-natur',
        Musik: 'chip-musik',
        Träffar: 'chip-traffar'
    };

    return chipClasses[category] || 'chip-default';
}

function metaRow(iconSvg, text) {
    const li = document.createElement('li');
    li.innerHTML = iconSvg;

    const span = document.createElement('span');
    span.textContent = text;

    li.appendChild(span);
    return li;
}

function createActivityCard(activity, marker) {
    const card = document.createElement('article');
    card.className = 'card';

    const top = document.createElement('div');
    top.className = 'card-top';

    const chip = document.createElement('span');
    chip.className = `chip ${getChipClass(activity.category)}`;
    chip.textContent = activity.category;

    // Filled in by updateDistances() once the user's location is known.
    const distance = document.createElement('span');
    distance.className = 'card-distance';

    top.append(chip, distance);

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = activity.title;

    const meta = document.createElement('ul');
    meta.className = 'card-meta';
    meta.append(
        metaRow(ICON_CALENDAR, `${activity.date} · ${activity.time}`),
        metaRow(ICON_PIN, activity.location)
    );

    const description = document.createElement('p');
    description.className = 'card-desc';
    description.textContent = activity.description;

    const bottom = document.createElement('div');
    bottom.className = 'card-bottom';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'card-btn';
    button.textContent = 'Visa aktivitet';
    button.addEventListener('click', () => showActivityOnMap(marker));

    bottom.appendChild(button);

    card.append(top, title, meta, description, bottom);
    return card;
}

// Fly to the marker and open its popup.
function showActivityOnMap(marker) {
    map.flyTo({
        center: marker.getLngLat(),
        zoom: Math.max(map.getZoom(), 14),
        essential: true
    });

    if (!marker.getPopup().isOpen()) {
        marker.togglePopup();
    }
}

function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = (deg) => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(km) {
    if (km < 1) {
        return Math.round(km * 1000) + ' m';
    }
    return km.toFixed(1).replace('.', ',') + ' km';
}

function updateDistances() {
    if (!userLocation) {
        return;
    }

    activityMarkers.forEach(({ activity, card }) => {
        const km = distanceKm(
            userLocation.latitude,
            userLocation.longitude,
            activity.latitude,
            activity.longitude
        );
        card.querySelector('.card-distance').textContent = formatDistance(km);
    });
}

function updateFeedCount() {
    const visible = activityMarkers.filter(
        ({ card }) => card.style.display !== 'none'
    ).length;

    document.getElementById('feed-count').textContent =
        visible + (visible === 1 ? ' aktivitet' : ' aktiviteter');
}

function getCategoryClass(category) {
    const categoryClasses = {
        Sport: 'marker-sport',
        Kultur: 'marker-kultur',
        Natur: 'marker-natur',
        Musik: 'marker-musik'
    };

    return categoryClasses[category] || 'marker-default';
}


//besök api backend för att hämta aktiviteter och lägga till dem på kartan
async function loadActivities() {
    try {
        const response = await fetch('./activities.json');

        if (!response.ok) {
            throw new Error(`Could not load activities: ${response.status}`);
        }

        const activities = await response.json();

        activities.forEach((activity) => {
            addActivityMarker(activity);
        });
    } catch (error) {
        console.error('Could not load activities:', error);
    }
}

// Build the filter checkboxes once the activities have loaded.
loadActivities().then(buildFilterOptions);
//loppa igen alla aktiviteter och lägg till dem på kartan

// Categories the user has unchecked in the filter panel.
const hiddenCategories = new Set();

const searchInput = document.getElementById("searchinput");
const filterButton = document.getElementById("filter");
const filterPanel = document.getElementById("filterpanel");

// Show a marker (and its card) only if its title contains the search word
// AND its category is checked in the filter panel.
function applyFilters() {
    const search = searchInput.value.trim().toLowerCase();

    activityMarkers.forEach(({ activity, marker, card }) => {
        const matchesSearch = activity.title.toLowerCase().includes(search);
        const isChecked = !hiddenCategories.has(activity.category);
        const visible = matchesSearch && isChecked;

        marker.getElement().style.display = visible ? '' : 'none';
        card.style.display = visible ? '' : 'none';

        // Close the popup if its marker gets hidden.
        if (!visible && marker.getPopup().isOpen()) {
            marker.togglePopup();
        }
    });

    updateFeedCount();
}

// Build one checkbox per category that exists on the map.
function buildFilterOptions() {
    const categories = [...new Set(activityMarkers.map(({ activity }) => activity.category))];

    categories.forEach((category) => {
        const label = document.createElement('label');
        label.className = 'filteroption';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                hiddenCategories.delete(category);
            } else {
                hiddenCategories.add(category);
            }
            applyFilters();
        });

        label.append(checkbox, ` ${category}`);
        filterPanel.appendChild(label);
    });
}

// Open/close the filter panel.
filterButton.addEventListener("click", function () {
    filterPanel.hidden = !filterPanel.hidden;
    filterButton.setAttribute("aria-expanded", String(!filterPanel.hidden));
});

// Close the panel when clicking somewhere else.
document.addEventListener("click", function (e) {
    if (!e.target.closest(".filtercont")) {
        filterPanel.hidden = true;
        filterButton.setAttribute("aria-expanded", "false");
    }
});

document.getElementById("searchform").addEventListener("submit", function (e) {
    e.preventDefault(); // stop the page from reloading
    applyFilters();
});

// Only search on Enter/Sök, but show everything again when the field is cleared.
searchInput.addEventListener("input", function () {
    if (searchInput.value.trim() === "") {
        applyFilters();
    }
});

function updateUserLocation(position) {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;

    userLocation = {
        latitude: userLat,
        longitude: userLng
    };

    map.flyTo({
        center: [userLng, userLat],
        zoom: 14
    });

    addUserMarker(userLng, userLat);
    updateDistances();
}

function requestUserLocation() {
    if (!navigator.geolocation) {
        console.error('Geolocation stöds inte i denna webbläsare.');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        updateUserLocation,
        (error) => {
            console.error('Kunde inte hämta plats:', error.message);
        },
        {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000
        }
    );
}

requestUserLocation();

class RecenterControl {
    onAdd(map) {
        this.map = map;

        this.container = document.createElement('div');
        this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';

        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.className = 'recenter-control-button';
        this.button.title = 'Center on my location';
        this.button.setAttribute('aria-label', 'Center on my location');
        this.button.innerHTML = '<img src="images/location_icon.png">';

        this.button.addEventListener('click', () => {
            if (userLocation) {
                map.flyTo({
                    center: [
                        userLocation.longitude,
                        userLocation.latitude
                    ],
                    zoom: 14,
                    essential: true
                });
            } else {
                requestUserLocation();
            }
        });

        this.container.appendChild(this.button);

        return this.container;
    }

    onRemove() {
        this.container.remove();
        this.map = undefined;
    }
}

map.addControl(
    new RecenterControl(),
    'top-right'
);
