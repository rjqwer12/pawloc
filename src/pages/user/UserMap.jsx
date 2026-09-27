import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import UserLayout from '../../components/UserLayout';
import { shelters } from '../../data/shelters';
import { drivingRoute, findShelter } from '../../lib/maps';
import './UserMap.css';

export default function UserMap() {
  const [params] = useSearchParams();
  const shelter = shelters.find(item => String(item.id) === params.get('shelter'));
  // City overview only; never used as a shelter destination.
  const container = useRef(null);
  const map = useRef(null);
  const mode = useRef(null);
  const locationRequest = useRef(0);
  const lookupRequest = useRef(0);
  const [selection, setSelection] = useState(null);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [message, setMessage] = useState('');
  const [route, setRoute] = useState(null);
  const [routeMessage, setRouteMessage] = useState('');
  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    const instance = L.map(container.current).setView([10.72, 122.54], 13);
    map.current = instance;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).on('tileerror', () => setTileError(true)).addTo(instance);
    instance.on('click', event => {
      if (!mode.current) return;
      const point = [event.latlng.lat, event.latlng.lng];
      if (mode.current === 'start') setStart(point);
      else setEnd(point);
      locationRequest.current += 1;
      setMessage('Point selected on the map.');
      mode.current = null;
      setSelection(null);
    });
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(container.current);
    return () => { locationRequest.current += 1; observer.disconnect(); instance.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    let active = true;
    const lookup = ++lookupRequest.current;
    setEnd(null);
    mode.current = null;
    setSelection(null);
    setMessage(shelter ? 'Finding the shelter on OpenStreetMap…' : 'Choose a shelter or select a destination on the map.');
    if (shelter) {
      findShelter(shelter).then(point => {
        if (!active || lookup !== lookupRequest.current) return;
        if (point) {
          setEnd(point);
          map.current?.setView(point, 16);
          setMessage('Shelter found. Choose your starting point to see a driving route.');
        } else {
          setMessage('This sample shelter has no mapped location yet. The map shows the Iloilo area. Select its destination on the map to plan a route.');
        }
      }).catch(error => { if (active && lookup === lookupRequest.current) setMessage(error.message); });
    }
    return () => { active = false; };
  }, [shelter]);

  useEffect(() => {
    const layers = L.layerGroup().addTo(map.current);
    if (start) L.circleMarker(start, { radius: 9, color: '#2674cf', fillOpacity: 1 }).bindTooltip('Starting point').addTo(layers);
    if (end) L.circleMarker(end, { radius: 10, color: '#689d4b', fillOpacity: 1 }).bindTooltip('Destination').addTo(layers);
    return () => layers.remove();
  }, [start, end]);

  useEffect(() => {
    setRoute(null);
    setRouteMessage('');
    if (!start || !end) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let active = true;
    let line;
    setRouteMessage('Calculating driving route…');
    drivingRoute(start, end, controller.signal).then(result => {
      if (!active) return;
      line = L.geoJSON(result.geometry, { style: { color: '#689d4b', weight: 5 } }).addTo(map.current);
      map.current.fitBounds(line.getBounds(), { padding: [35, 35] });
      setRoute(result);
      setRouteMessage('');
    }).catch(error => {
      if (active) setRouteMessage(error.name === 'AbortError' ? 'Route request timed out. Change a point to try again.' : error.message);
    }).finally(() => clearTimeout(timeout));
    return () => { active = false; controller.abort(); clearTimeout(timeout); line?.remove(); };
  }, [start, end]);

  function choosePoint(value) {
    if (value === 'end') lookupRequest.current += 1;
    mode.current = value;
    setSelection(value);
    locationRequest.current += 1;
    setMessage(`Click or tap the map to set your ${value === 'start' ? 'starting point' : 'destination'}.`);
  }

  function locate() {
    if (!window.isSecureContext || !navigator.geolocation) {
      setMessage('Location access needs HTTPS or localhost. Use “Choose starting point” on this connection.');
      return;
    }
    const request = ++locationRequest.current;
    mode.current = null;
    setSelection(null);
    setMessage('Waiting for your location…');
    navigator.geolocation.getCurrentPosition(position => {
      if (request !== locationRequest.current) return;
      const point = [position.coords.latitude, position.coords.longitude];
      setStart(point);
      map.current?.setView(point, 15);
      setMessage('Your location is set as the starting point.');
    }, () => {
      if (request === locationRequest.current) setMessage('Could not access your location. Choose a starting point on the map instead.');
    }, { timeout: 10000, maximumAge: 60000 });
  }

  return (
    <UserLayout>
      <main className="user-map-main">
        <header className="user-map-heading"><h1>Map</h1><Link to="/user/shelters">Browse shelters</Link></header>
        {shelter && <section className="user-map-destination"><h2>{shelter.name}</h2><p>{shelter.landmark}</p></section>}
        {params.has('shelter') && !shelter && <p role="alert">Shelter not found. Choose one from the shelter directory.</p>}
        <div className="user-map-actions">
          <button onClick={locate}>Use my location</button>
          <button aria-pressed={selection === 'start'} onClick={() => choosePoint('start')}>Choose starting point</button>
          <button aria-pressed={selection === 'end'} onClick={() => choosePoint('end')}>Choose destination</button>
        </div>
        <p className="user-map-status" role="status">{message}</p>
        <div className={`user-map-canvas${selection ? ' user-map-selecting' : ''}`} ref={container} aria-label="Interactive OpenStreetMap" />
        {tileError && <p role="alert">Some map tiles could not load. Check your connection and reload.</p>}
        <p className="user-map-status" role="status">{routeMessage}{route && `Driving route: ${(route.distance / 1000).toFixed(1)} km · about ${Math.max(1, Math.round(route.duration / 60))} minutes. Estimate excludes live traffic.`}</p>
      </main>
    </UserLayout>
  );
}
