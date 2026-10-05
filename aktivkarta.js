const map = new maplibregl.Map({
 container: 'map',
 style: 'https://tiles.openfreemap.org/styles/liberty',
 center: [17.3147, 62.3898],
 zoom: 14
 });

 map.addControl(new maplibregl.NavigationControl(), 'top-right');

 map.on('error', (e) => console.error('Kartfel:', e.error));

 map.on('load', () => {
 for (const layer of map.getStyle().layers) {
 const id = layer.id.toLowerCase();

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
 }

 if (navigator.geolocation) {
     navigator.geolocation.getCurrentPosition(
         (position) => {
             const userLat = position.coords.latitude;
             const userLng = position.coords.longitude;

             map.flyTo({
                 center: [userLng, userLat],
                 zoom: 14
             });

             addUserMarker(userLng, userLat);
         },
         (error) => {
             console.error('Kunde inte hämta plats:', error.message);
         },
         {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000
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
 const element = document.createElement('div');
 element.className = 'user-marker';

 const popup = new maplibregl.Popup({ offset: 18 })
 .setHTML('<strong>Din plats</strong>');

 new maplibregl.Marker({ element })
 .setLngLat([longitude, latitude])
 .setPopup(popup)
 .addTo(map);
 }

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

    new maplibregl.Marker({
        element: markerElement,
        anchor: 'bottom'
    })
        .setLngLat([activity.longitude, activity.latitude])
        .setPopup(popup)
        .addTo(map);
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

addActivityMarker({
    longitude: 17.311523909612948,
    latitude: 62.39005200377482,
    title: 'Fotboll för ungdomar',
    category: 'Sport',
    description: 'Kom och spela fotboll tillsammans med andra ungdomar.',
    date: 'Lördag 12 oktober',
    time: '14:00–16:00',
    location: 'Hedbergska planen',
    image: 'images/fotboll.jpg',
      markerImage: 'images/sport.png'
});

addActivityMarker({
    longitude: 17.30373085233,
    latitude: 62.38855180836299,
    title: 'Målarkväll',
    category: 'Kultur',
    description: 'En avslappnad kväll där alla får prova att måla.',
    date: 'Söndag 13 oktober',
    time: '18:00–20:00',
    location: 'Kulturhuset',
    image: 'images/image1.jpg',
    markerImage: 'images/kultur.png'
});
