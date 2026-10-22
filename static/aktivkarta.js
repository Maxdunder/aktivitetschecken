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

 // Every activity marker on the map, used by the search.
 const activityMarkers = [];

 function addActivityMarker(activity) {
       displayActivity(activity);
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

    // Save the marker so the search can show/hide it.
    activityMarkers.push({ activity, marker });
}
function displayActivity(activity) {
    const activityBox = document.querySelector('.activitybox');

    activityBox.querySelector('.boxtitle').textContent =  activity.title;
    activityBox.querySelector('.boxcategory').textContent = "Typ av aktivitet: " + activity.category;
    activityBox.querySelector('.boxdescription').textContent =
        activity.description;
    activityBox.querySelector('.boxdate').textContent =  "Datum: " + activity.date;
    activityBox.querySelector('.boxtime').textContent = "Tid: "+ activity.time;
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
        const response = await fetch('./static/activities.json');

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

loadActivities();
loadActivities();
//loppa igen alla aktiviteter och lägg till dem på kartan

// Categories the user has unchecked in the filter panel.
const hiddenCategories = new Set();

const searchInput = document.getElementById("searchinput");
const filterButton = document.getElementById("filter");
const filterPanel = document.getElementById("filterpanel");

// Show a marker only if its title contains the search word
// AND its category is checked in the filter panel.
function applyFilters() {
    const search = searchInput.value.trim().toLowerCase();

    activityMarkers.forEach(({ activity, marker }) => {
        const matchesSearch = activity.title.toLowerCase().includes(search);
        const isChecked = !hiddenCategories.has(activity.category);
        const visible = matchesSearch && isChecked;

        marker.getElement().style.display = visible ? '' : 'none';

        // Close the popup if its marker gets hidden.
        if (!visible && marker.getPopup().isOpen()) {
            marker.togglePopup();
        }
    });
}

// Build one checkbox per category that exists on the map.
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
