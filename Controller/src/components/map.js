import React, { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./map.css";
import { API_KEY } from '../config';
export function Map({ coordinates }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, lat] = coordinates || [];
  const [zoom] = useState(14);
  const [REGION] = useState("us-east-1");
  const [MAP_NAME] = useState("macchinetta");
  const [API_KEY] = useState(API_KEY);

  useEffect(() => {
    if (map.current) {
      const marker = new maplibregl.Marker()
      marker.setLngLat(coordinates).addTo(map.current);
      return;
    }

    else if (coordinates[0] != 0 || coordinates[1] != 0) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: `https://maps.geo.${REGION}.amazonaws.com/maps/v0/maps/${MAP_NAME}/style-descriptor?key=${API_KEY}`,
        center: [coordinates[0], coordinates[1]],
        zoom: zoom,
      });
      map.current.addControl(new maplibregl.NavigationControl(), "top-right");
    }

  }, [coordinates, lng, lat]);

  return (
    <div className='map-wrap'>
      <div ref={mapContainer} className='map' />
    </div>
  );
}

export default Map;
