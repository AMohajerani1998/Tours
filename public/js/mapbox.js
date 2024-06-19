/* eslint-disable */
export const loadMap = (locations) => {
    mapboxgl.accessToken =
        'pk.eyJ1IjoiYW1vaGFqZXJhbmkxOTk4IiwiYSI6ImNseGJvYjU5NTI0OHYyanNjaWhnOGNtNXMifQ.qvICG2w-BWXdZFGysJeJew';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/amohajerani1998/clxbp1nrl02a801pnd23g32xr',
        scrollZoom: false,
        // interactive: false,
        // zoom: 10,
        // center: [-118.29358, 34.058336], // [lng, lat]
    });

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach((location) => {
        // create marker
        const element = document.createElement('div');
        element.className = 'marker';

        // add marker
        new mapboxgl.Marker({
            element: element,
            anchor: 'bottom',
        })
            .setLngLat(location.coordinates)
            .addTo(map);

        new mapboxgl.Popup({
            offset: 50,
        })
            .setLngLat(location.coordinates)
            .setHTML(`<p>Day ${location.day}: ${location.description}</p>`)
            .addTo(map);

        // extend map bounds to include current location
        bounds.extend(location.coordinates);
    });

    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100,
        },
    });
};
