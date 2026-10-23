import heartIcon from '@iconify-icons/lucide/heart';
import AppIcon from '../../components/UserIcon';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import UserLayout from '../../components/UserLayout';
import Icon from '../../components/UserIcon';
import { listRecords } from '../../lib/userData';
import { useAuth } from '../../lib/AuthContext';
import { drivingRoute, findShelter } from '../../lib/maps';
import './UserMap.css';

export default function UserMap() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(true);
  const { user } = useAuth();
  const [shelters, setShelters] = useState([]);
  const shelter = params.has('shelter') ? shelters.find(item => String(item.id) === params.get('shelter')) : shelters[0];
  const results = shelters.filter(item => [item.name, item.landmark].some(value => value?.toLowerCase().includes(search.trim().toLowerCase())));
  function selectShelter(item) { setParams({ shelter: item.id }); setSearch(item.name); setSearchOpen(false); setCardOpen(true); }
  // City overview only; never used as a shelter destination.
  const container = useRef(null);
  const map = useRef(null);
  const mode = useRef(null);
  const locationRequest = useRef(0);
  const locationWatch = useRef(null);
  const locationReady = useRef(false);
  const followLocation = useRef(true);
  const ownLocationRef = useRef(null);
  const endRef = useRef(null);
  const lookupRequest = useRef(0);
  const [selection, setSelection] = useState(null);
  const [start, setStart] = useState(null);
  const [ownLocation, setOwnLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const locationTimer = useRef(null);
  const [routeRequested, setRouteRequested] = useState(params.has('shelter'));
  const [routeAttempt, setRouteAttempt] = useState(0);
  const [end, setEnd] = useState(null);
  const [message, setMessage] = useState('');
  const [route, setRoute] = useState(null);
  const [routeMessage, setRouteMessage] = useState('');
  const [tileError, setTileError] = useState(false);
  useEffect(() => { endRef.current = end; }, [end]);
  useEffect(() => { if (user) listRecords('shelter').then(setShelters).catch(error => setMessage(error.message)); }, [user]);


  useEffect(() => {
    const instance = L.map(container.current, { zoomControl: false }).setView([10.72, 122.54], 13);
    L.control.zoom({ position: 'bottomright' }).addTo(instance);
    map.current = instance;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).on('tileerror', () => setTileError(true)).addTo(instance);
    instance.on('click', event => {
      if (!mode.current) return;
      const point = [event.latlng.lat, event.latlng.lng];
      if (mode.current === 'start') { followLocation.current = false; setStart(point); }
      else setEnd(point);
      setMessage('Point selected on the map.');
      mode.current = null;
      setSelection(null);
    });
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(container.current);
    return () => { locationRequest.current += 1; clearTimeout(locationTimer.current); if (locationWatch.current !== null) navigator.geolocation.clearWatch(locationWatch.current); observer.disconnect(); instance.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    let active = true;
    const lookup = ++lookupRequest.current;
    mode.current = null;
    setSelection(null);
    setMessage(shelter ? 'Finding the shelter on OpenStreetMap…' : 'Choose a shelter or select a destination on the map.');
    if (shelter) {
      findShelter(shelter).then(point => {
        if (!active || lookup !== lookupRequest.current) return;
        if (point) {
          setEnd(point);
          if (ownLocationRef.current) map.current?.fitBounds([point, ownLocationRef.current], { padding: [70, 70], maxZoom: 16 });
          else map.current?.setView(point, 16);
          setMessage('Shelter found. Press Directions for a route from your location.');
        } else {
          setMessage('No mapped location is available for this shelter. Use Directions to choose its location on the map.');
        }
      }).catch(error => { if (active && lookup === lookupRequest.current) setMessage(error.message); });
    }
    return () => { active = false; };
  }, [shelter]);

  useEffect(() => {
    const layers = L.layerGroup().addTo(map.current);
    if (ownLocation) L.circleMarker(ownLocation, { radius: 8, color: '#ffffff', weight: 3, fillColor: '#2674ef', fillOpacity: 1 }).bindTooltip('Your location').addTo(layers);
    if (start && start !== ownLocation) L.circleMarker(start, { radius: 7, color: '#475569', fillColor: '#ffffff', fillOpacity: 1 }).bindTooltip('Selected starting point').addTo(layers);
    if (end) {
      const icon = L.divIcon({ className: 'map-shelter-pin', html: `<span aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18">${heartIcon.body}</svg></span>`, iconSize: [36, 42], iconAnchor: [18, 42] });
      const label = document.createElement('span');
      label.textContent = shelter?.name || 'Destination';
      L.marker(end, { icon, title: shelter?.name || 'Destination' }).bindTooltip(label).on('click', () => setCardOpen(true)).addTo(layers);
    }
    return () => layers.remove();
  }, [start, end, shelter, ownLocation]);

  useEffect(() => {
    setRoute(null);
    setRouteMessage('');
    if (!routeRequested || !start || !end) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let active = true;
    let line;
    setRouteMessage('Calculating driving route…');
    drivingRoute(start, end, controller.signal).then(result => {
      if (!active) return;
      line = L.geoJSON(result.geometry, { style: { color: '#2674ef', weight: 5 } }).addTo(map.current);
      map.current.fitBounds(line.getBounds(), { padding: [35, 35] });
      setRoute(result);
      setRouteMessage('');
    }).catch(error => {
      if (active) setRouteMessage(error.name === 'AbortError' ? 'Route request timed out. Change a point to try again.' : error.message);
    }).finally(() => clearTimeout(timeout));
    return () => { active = false; controller.abort(); clearTimeout(timeout); line?.remove(); };
  }, [start, end, routeRequested, routeAttempt]);

  function choosePoint(value) {
    if (value === 'end') lookupRequest.current += 1;
    mode.current = value;
    setSelection(value);
    setMessage(`Click or tap the map to set your ${value === 'start' ? 'starting point' : 'destination'}.`);
  }

  useEffect(() => { locate(); }, []);

  function locate() {
    if (!window.isSecureContext || !navigator.geolocation) {
      setLocationError('Location access needs HTTPS or localhost. You can choose a starting point on the map instead.');
      return;
    }
    const request = ++locationRequest.current;
    if (locationWatch.current !== null) navigator.geolocation.clearWatch(locationWatch.current);
    locationWatch.current = null;
    locationReady.current = false;
    followLocation.current = true;
    setLocationError('');
    clearTimeout(locationTimer.current);
    locationTimer.current = setTimeout(() => { if (request === locationRequest.current) setLocationError('Location is taking too long. Check browser location permission, then try again.'); }, 18000);
    mode.current = null;
    setSelection(null);
    setMessage('Waiting for your location…');
    locationWatch.current = navigator.geolocation.watchPosition(position => {
      if (request !== locationRequest.current) return;
      clearTimeout(locationTimer.current);
      setLocationError('');
      const point = [position.coords.latitude, position.coords.longitude];
      ownLocationRef.current = point;
      setOwnLocation(point);
      if (followLocation.current) setStart(previous => !previous || map.current?.distance(previous, point) >= 25 ? point : previous);
      if (!locationReady.current) {
        locationReady.current = true;
        if (endRef.current) map.current?.fitBounds([point, endRef.current], { padding: [70, 70], maxZoom: 16 });
        else map.current?.setView(point, 15);
      }
      setMessage('Your location is shown by the blue dot.');
    }, error => {
      if (request !== locationRequest.current) return;
      clearTimeout(locationTimer.current);
      setLocationError(error.code === 1 ? 'Location permission was denied. Allow location access in your browser, then press Use my location.' : 'Could not find your location. Try again or select a starting point on the map.');
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
  }

  return (
    <UserLayout>
      <main className="user-map-main">
        <header className="user-map-heading"><h1>Map</h1></header>
        {params.has('shelter') && !shelter && <p role="alert">Shelter not found. Choose one from the shelter directory.</p>}
        <div className="user-map-stage">
        <div className="map-shelter-search" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false); }}>
          <form role="search" onSubmit={event => { event.preventDefault(); if (results.length) selectShelter(results[0]); }} onKeyDown={event => { if (event.key === 'Escape') setSearchOpen(false); }}>
            <Icon name="search" />
            <input type="search" aria-label="Search shelters" placeholder="Search shelters by name or location" value={search} onFocus={() => setSearchOpen(true)} onChange={event => { setSearch(event.target.value); setSearchOpen(true); }} />
          </form>
          {searchOpen && <div className="map-shelter-results" aria-label="Shelter search results">
            {results.length ? results.map(item => <button type="button" key={item.id} onClick={() => selectShelter(item)}><Icon name="pin" /><span><strong>{item.name}</strong><small>{item.landmark || 'Address unavailable'}</small></span></button>) : <p role="status">No shelters found.</p>}
          </div>}
        </div>
        <div className={`user-map-canvas${selection ? ' user-map-selecting' : ''}`} ref={container} aria-label="Interactive OpenStreetMap" />
        <button className="map-locate" onClick={locate} aria-label="Find my location" title="Find my location"><Icon name="pin" /></button>
        {shelter && cardOpen && <aside className="map-place-card" aria-label="Shelter details">
          <div className="map-place-photo">
            {shelter.image ? <img src={shelter.image} alt={shelter.name} /> : <div className="map-place-placeholder"><Icon name="shelter" /><span>Shelter photo unavailable</span></div>}
            <button className="map-place-close" aria-label="Close shelter details" onClick={() => setCardOpen(false)}><AppIcon name="close" /></button>
          </div>
          <div className="map-place-content">
            <h2>{shelter.name}</h2>
            {shelter.status && <p className="map-place-open">{shelter.status}</p>}
            <div className="map-place-actions">
              <button className="map-directions-button" onClick={() => { setRouteRequested(true); setRouteAttempt(value => value + 1); if (!end) choosePoint('end'); else if (!start) locate(); }}><Icon name="map" />Directions</button>
              {routeRequested && <button type="button" className="map-cancel-route" onClick={() => { setRouteRequested(false); setRoute(null); setRouteMessage(''); mode.current = null; setSelection(null); }}>Cancel directions</button>}
            </div>
            <p><Icon name="pin" /><span>{shelter.landmark || 'Address unavailable'}</span></p>
            {shelter.hours && <p><Icon name="calendar" /><span>{shelter.hours}</span></p>}
          </div>
        </aside>}
        </div>
        {locationError && <p className="user-map-status"><button onClick={() => { setRouteRequested(true); choosePoint('start'); }}>Choose starting point on map</button></p>}
        {tileError && <p role="alert">Some map tiles could not load. Check your connection and reload.</p>}
        <p className="user-map-status" role="status">{routeMessage}{route && `Driving route: ${(route.distance / 1000).toFixed(1)} km · about ${Math.max(1, Math.round(route.duration / 60))} minutes. Estimate excludes live traffic.`}</p>
      </main>
    </UserLayout>
  );
}
