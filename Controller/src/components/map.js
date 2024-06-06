import React, { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./map.css";

export function Map({ coordinates }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, lat] = coordinates || [];
  const [zoom] = useState(14);
  const [REGION] = useState("us-east-1");
  const [MAP_NAME] = useState("macchinetta");
  const [API_KEY] = useState(
    "v1.public.eyJqdGkiOiI5YTkxYzAyYy1jODM4LTRiNDAtODIwMy04NWM2MzY0ZDRhMWMifVT_xOMKqFFn9RMMvxPpCCjTapY0kmSBY4HrV1U55_xhurjsAyIVeBWS2hg9-vI7utF1acvX77s7pXYvltuTxInwbI-ez75mQAGkbTiPwPFNs43_mWqklub3eXtDAoAP5_K4Sb9Ei5ttB11d-Y6rR2VbgS5bnNPiL_o2nNnJmWcjAPaE0m1YmOB_TzjHFtlJSdEnkoWtUuZQ27hd5FitMJsK30KT3frtqFjVy1IF472GYDhcU9F96sQ4K8I_Nhr6vFuZD5uhIfhv9kMAgNUGCVxWCfK4rMKrW1hI4nGYkXBpG9a6zUOtOnUPhrr2RZ9v-0ydBnayKOAROPYWqEWJqjk.ZWU0ZWIzMTktMWRhNi00Mzg0LTllMzYtNzlmMDU3MjRmYTkx"
  );

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
