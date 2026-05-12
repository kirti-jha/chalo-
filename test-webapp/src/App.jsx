import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMap } from 'react-leaflet';

// Fix leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

import './index.css';

// Add modern font to document head
const style = document.createElement('style');
style.textContent = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');`;
document.head.appendChild(style);

import { Toaster, toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

const getAuthHeaders = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

// --- Landing Page ---
const LandingPage = () => (
  <div className="landing-page">
    <div className="blob blob-1"></div>
    <div className="blob blob-2"></div>
    <div className="floating-shape" style={{top:'15%', left:'5%', animationDelay:'0s'}}>⚡ Fast</div>
    <div className="floating-shape" style={{bottom:'20%', left:'10%', animationDelay:'2s'}}>🛡️ Safe</div>
    <div className="floating-shape" style={{top:'10%', right:'20%', animationDelay:'4s'}}>💰 Cheap</div>

    <div className="glass-card">
      <div className="hero-text">
        <h1>Chalo App</h1>
        <p style={{fontSize:'1.4rem', opacity:0.9, marginBottom:'2rem', maxWidth:'500px'}}>
          India's most trusted bike-taxi platform. Faster than traffic, cheaper than cars, and now more premium.
        </p>
        <div className="auth-buttons" style={{display:'flex', gap:'1.5rem'}}>
          <Link to="/auth/rider" className="btn btn-primary">Book a Ride</Link>
          <Link to="/auth/driver" className="btn btn-outline">Start Earning</Link>
        </div>
        
        <div className="features-mini" style={{display:'flex', gap:'2rem', marginTop:'3rem'}}>
          <div className="feat-item" style={{textAlign:'center'}}>
            <div style={{fontSize:'2rem'}}>🚀</div>
            <p style={{fontSize:'0.8rem', opacity:0.6}}>Fastest</p>
          </div>
          <div className="feat-item" style={{textAlign:'center'}}>
            <div style={{fontSize:'2rem'}}>💎</div>
            <p style={{fontSize:'0.8rem', opacity:0.6}}>Premium</p>
          </div>
          <div className="feat-item" style={{textAlign:'center'}}>
            <div style={{fontSize:'2rem'}}>🔒</div>
            <p style={{fontSize:'0.8rem', opacity:0.6}}>Secure</p>
          </div>
        </div>

        <div style={{marginTop:'3rem'}}>
          <Link to="/auth/admin" style={{color:'rgba(255,255,255,0.4)', fontSize:'0.9rem', textDecoration:'none'}}>Admin Console &rarr;</Link>
        </div>
      </div>
      <div className="hero-visual" style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
        <img 
          src={new URL('./hero.png', import.meta.url).href} 
          alt="Chalo Hero" 
          className="hero-image"
          style={{width:'100%', filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.5))', marginBottom:'2rem'}}
        />
        <div className="trust-stats" style={{display:'flex', gap:'20px', background:'rgba(255,255,255,0.05)', padding:'1rem 2rem', borderRadius:'1.5rem', border:'1px solid var(--glass-border)'}}>
          <div style={{textAlign:'center'}}><h4 style={{margin:0, color: 'var(--primary)'}}>4.8/5</h4><p style={{margin:0, fontSize:'0.7rem', opacity:0.6}}>App Store</p></div>
          <div style={{width:'1px', background:'var(--glass-border)'}}></div>
          <div style={{textAlign:'center'}}><h4 style={{margin:0, color: 'var(--primary)'}}>10M+</h4><p style={{margin:0, fontSize:'0.7rem', opacity:0.6}}>Riders</p></div>
          <div style={{width:'1px', background:'var(--glass-border)'}}></div>
          <div style={{textAlign:'center'}}><h4 style={{margin:0, color: 'var(--primary)'}}>50K+</h4><p style={{margin:0, fontSize:'0.7rem', opacity:0.6}}>Captains</p></div>
        </div>
      </div>
    </div>
  </div>
);

// --- Auth Page (Login/Signup) ---
const AuthPage = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', vehicleNumber: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? `/auth/${role}/login` : `/auth/${role}/register`;
      const res = await axios.post(`${API_URL}${endpoint}`, formData);
      const tokenKey = role === 'rider' ? 'riderToken' : role === 'driver' ? 'driverToken' : 'adminToken';
      const userKey = role === 'rider' ? 'riderUser' : role === 'driver' ? 'driverUser' : 'adminUser';
      
      localStorage.setItem(tokenKey, res.data.token);
      localStorage.setItem(userKey, JSON.stringify(res.data.user || res.data.driver || res.data.admin));
      
      navigate(role === 'admin' ? '/admin-dashboard' : `/${role}-dashboard`);
    } catch (err) {
      alert(err.response?.data?.message || 'Authentication failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="auth-card">
        <h2 style={{color:'var(--primary)'}}>{isLogin ? 'Welcome Back' : 'Join Chalo'}</h2>
        <p style={{marginBottom:'2rem', opacity:0.6}}>{isLogin ? `Login as ${role.toUpperCase()}` : `Create a ${role.toUpperCase()} account`}</p>
        <form onSubmit={handleSubmit}>
          {!isLogin && <input placeholder="Full Name" onChange={e => setFormData({...formData, name: e.target.value})} />}
          <input placeholder={isLogin ? "Email or any demo ID" : "Email Address"} onChange={e => setFormData({...formData, email: e.target.value})} />
          <input placeholder="Password" type="password" onChange={e => setFormData({...formData, password: e.target.value})} />
          {!isLogin && <input placeholder="Phone Number" onChange={e => setFormData({...formData, phone: e.target.value})} />}
          {!isLogin && role === 'driver' && <input placeholder="Driving License Number" onChange={e => setFormData({...formData, licenseNumber: e.target.value})} />}
          {!isLogin && role === 'driver' && <input placeholder="Vehicle Number (e.g. DL 01 AB 1234)" onChange={e => setFormData({...formData, vehicleNumber: e.target.value})} />}
          <button type="submit" className="btn btn-primary" style={{width:'100%', marginTop:'1rem'}}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        {role !== 'admin' && (
          <p onClick={() => setIsLogin(!isLogin)} style={{cursor:'pointer', marginTop:'1.5rem', textAlign:'center', fontSize:'0.9rem', color:'var(--primary)', fontWeight:'600'}}>
            {isLogin ? "New here? Create an account" : "Already have an account? Sign In"}
          </p>
        )}
        <Link to="/" style={{display:'block', marginTop:'2rem', color:'white', opacity:0.4, textDecoration:'none', fontSize:'0.8rem'}}>&larr; Back to Home</Link>
      </div>
    </div>
  );
};

// Geocode a text address using Nominatim
const geocode = async (address) => {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
  const data = await r.json();
  if (!data.length) throw new Error('Location not found: ' + address);
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
};

const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await res.json();
    return data.display_name;
  } catch (e) { return `${lat.toFixed(4)}, ${lng.toFixed(4)}`; }
};

const LocationPicker = ({ onSelect }) => {
  const map = useMap();
  useEffect(() => {
    const handleClick = async (e) => {
      const { lat, lng } = e.latlng;
      const address = await reverseGeocode(lat, lng);
      onSelect(lat, lng, address);
    };
    map.on('click', handleClick);
    return () => map.off('click', handleClick);
  }, [map, onSelect]);
  return null;
};

const fetchRoute = async (start, end) => {
  try {
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
    const data = await res.json();
    if (data.routes && data.routes[0]) {
      return data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
    }
  } catch (e) { console.error('Routing error:', e); }
  return [start, end]; // Fallback to straight line
};

const MapRecenter = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
};

const SearchingOverlay = ({ onCancel }) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const start = Date.now();
    const duration = 5 * 60 * 1000; // 5 mins
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min((elapsed / duration) * 100, 100);
      setProgress(p);
      if (p >= 100) clearInterval(interval);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="searching-overlay">
      <div className="searching-content">
        <div className="spinner"></div>
        <h2>Finding your Captain</h2>
        <p>Connecting with nearby drivers...</p>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        <button className="btn btn-outline" style={{ marginTop: '2rem' }} onClick={onCancel}>Cancel Search</button>
      </div>
    </div>
  );
};

// --- Rider Dashboard ---
const RiderDashboard = () => {
  const navigate = useNavigate();
  const [rider, setRider] = useState(JSON.parse(localStorage.getItem('riderUser')));
  const [ride, setRide] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('map');
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  const [pickingMode, setPickingMode] = useState('pickup'); // 'pickup' or 'drop'
  const [searching, setSearching] = useState(false);
  const [myLocation, setMyLocation] = useState([28.6139, 77.2090]); // default Delhi, overridden by GPS
  const [driverLocation, setDriverLocation] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [routePath, setRoutePath] = useState([]);
  const [showSupport, setShowSupport] = useState(false);
  const socketRef = useRef();
  const riderToken = localStorage.getItem('riderToken');

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/rides/history`, getAuthHeaders(riderToken));
      setHistory(res.data);
    } catch (error) { console.error(error); }
  }, [riderToken]);

  useEffect(() => {
    if (!rider) return navigate('/');
    const historyTimer = setTimeout(() => {
      void fetchHistory();
    }, 0);
    // Get real GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMyLocation([pos.coords.latitude, pos.coords.longitude]),
        () => console.warn('GPS denied, using default location')
      );
    }
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('join', { userId: rider.id, role: 'RIDER' });
    socketRef.current.on('rideAccepted', async (updatedRide) => {
      setRide(updatedRide);
      setSearching(false); // Stop searching overlay
      if (updatedRide.driver?.currentLat) {
        const dLoc = [updatedRide.driver.currentLat, updatedRide.driver.currentLng];
        setDriverLocation(dLoc);
        const path = await fetchRoute(dLoc, [updatedRide.pickupLat, updatedRide.pickupLng]);
        setRoutePath(path);
      }
      toast.success('Captain found! They are on the way.');
    });
    socketRef.current.on('rideStatusUpdate', async (updatedRide) => {
      setRide(updatedRide);
      if (updatedRide.status === 'ONGOING') {
        const path = await fetchRoute([updatedRide.pickupLat, updatedRide.pickupLng], [updatedRide.dropLat, updatedRide.dropLng]);
        setRoutePath(path);
      }
      if (updatedRide.status === 'COMPLETED') {
        toast.success('Ride Completed!');
        setRoutePath([]);
        setDriverLocation(null);
        void fetchHistory();
      }
    });
    socketRef.current.on('driverLocationUpdate', (data) => {
      setDriverLocation([data.lat, data.lng]);
    });
    socketRef.current.on('rideCancelled', (updatedRide) => {
      setRide(updatedRide);
      setSearching(false);
      toast.error(`Ride cancelled: ${updatedRide.cancellationReason || 'No reason shared'}`);
      void fetchHistory();
    });
    socketRef.current.on('sosRaised', () => {
      toast.error('Emergency alert is active for this trip');
    });
    return () => {
      clearTimeout(historyTimer);
      socketRef.current.disconnect();
    };
  }, [fetchHistory, navigate, rider]);

  // Fetch nearby drivers
  useEffect(() => {
    if (activeTab !== 'map' || ride) return;
    
    const fetchNearby = async () => {
      try {
        const res = await axios.get(`${API_URL}/drivers/nearby?lat=${myLocation[0]}&lng=${myLocation[1]}`, getAuthHeaders(riderToken));
        setNearbyDrivers(res.data);
      } catch (e) { console.error(e); }
    };
    
    fetchNearby();
    const inv = setInterval(fetchNearby, 10000);
    return () => clearInterval(inv);
  }, [activeTab, myLocation, ride, riderToken]);

  const onMapClick = async (lat, lng, address) => {
    if (ride) return;
    if (pickingMode === 'pickup') {
      setPickup(address);
      setPickupCoords([lat, lng]);
      setPickingMode('drop');
    } else {
      setDrop(address);
      setDropCoords([lat, lng]);
    }
  };

  const bookRide = async () => {
    if (!pickup || !drop) return toast.error('Please enter or select pickup and drop locations');
    setSearching(true);
    try {
      let pLat, pLng, dLat, dLng;
      
      if (pickupCoords) {
        [pLat, pLng] = pickupCoords;
      } else {
        [pLat, pLng] = await geocode(pickup);
      }

      if (dropCoords) {
        [dLat, dLng] = dropCoords;
      } else {
        [dLat, dLng] = await geocode(drop);
      }

      const res = await axios.post(`${API_URL}/rides/request`, {
        pickupLocation: pickup,
        dropLocation: drop,
        pickupLat: pLat, pickupLng: pLng, dropLat: dLat, dropLng: dLng
      }, getAuthHeaders(riderToken));
      setRide(res.data);
      toast.success('Searching for nearby Captains...');
    } catch (error) {
      toast.error(error.message || 'Failed to request ride');
      setSearching(false);
    }
  };

  const cancelRide = async () => {
    if (!ride) return;
    const reason = window.prompt('Why are you cancelling this ride?', 'Changed plans');
    if (!reason) return;

    try {
      await axios.post(`${API_URL}/rides/cancel`, { rideId: ride.id, reason }, getAuthHeaders(riderToken));
      setRide(null); // Reset for re-booking
      setRoutePath([]);
      setSearching(false);
      setPickup('');
      setDrop('');
      setPickupCoords(null);
      setDropCoords(null);
      toast.success('Ride cancelled');
      void fetchHistory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to cancel ride');
    }
  };

  const triggerSos = async () => {
    if (!ride) return toast.error('Book or accept a ride first');
    const message = window.prompt('Describe the emergency briefly', 'I need immediate help on this trip');
    if (!message) return;

    try {
      await axios.post(`${API_URL}/rides/sos`, { rideId: ride.id, message }, getAuthHeaders(riderToken));
      toast.success('Emergency alert sent to support');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send SOS');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <h2 style={{color:'var(--primary)', marginBottom:'0.5rem'}}>Chalo Rider</h2>
        <p style={{opacity:0.6, fontSize:'0.8rem', marginBottom:'2rem'}}>{rider?.email}</p>
        
        <nav style={{display:'flex', flexDirection:'column', gap:'0.5rem', marginBottom:'2rem'}}>
          <button className={`btn ${activeTab === 'map' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('map')}>🗺️ Booking</button>
          <button className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('history')}>📜 History</button>
          <button className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('settings')}>⚙️ Settings</button>
          <button className="btn btn-outline" onClick={() => setShowSupport(true)}>Support</button>
        </nav>

        {activeTab === 'map' && (
          <div className="card">
            <p style={{fontSize:'0.7rem', opacity:0.6, marginBottom:'0.5rem'}}>
              Click on map to select: <strong>{pickingMode === 'pickup' ? 'PICKUP' : 'DESTINATION'}</strong>
            </p>
            <div style={{display:'flex', gap:'0.5rem', marginBottom:'0.5rem', flexWrap:'wrap'}}>
               <button className={`btn ${pickingMode === 'pickup' ? 'btn-primary' : 'btn-outline'}`} style={{flex:1, fontSize:'0.7rem'}} onClick={() => setPickingMode('pickup')}>Set Pickup</button>
               <button className={`btn ${pickingMode === 'drop' ? 'btn-primary' : 'btn-outline'}`} style={{flex:1, fontSize:'0.7rem'}} onClick={() => setPickingMode('drop')}>Set Drop</button>
            </div>
            <input placeholder="Pickup Location" value={pickup} onChange={e => setPickup(e.target.value)} disabled={ride} />
            <input placeholder="Drop Location" value={drop} onChange={e => setDrop(e.target.value)} disabled={ride} />
            <button className="btn btn-primary" style={{width:'100%', marginTop:'1rem'}} onClick={bookRide} disabled={ride || searching}>
              {searching ? 'Finding Captain...' : ride ? `Status: ${ride.status}` : 'Book Now'}
            </button>

            {ride && ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED' && ride.driver && (
              <div style={{marginTop:'1.5rem', borderTop:'1px solid var(--glass-border)', paddingTop:'1rem'}}>
                <div style={{display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1rem'}}>
                  <div style={{width:'50px', height:'50px', background:'var(--primary)', borderRadius:'50%', display:'flex', justifyContent:'center', alignItems:'center', fontSize:'1.5rem'}}>🛵</div>
                  <div>
                    <h4 style={{margin:0}}>{ride.driver.name}</h4>
                    <p style={{margin:0, fontSize:'0.8rem', opacity:0.6}}>{ride.driver.vehicleNumber}</p>
                    <div style={{fontSize:'0.75rem', color:'var(--primary)'}}>★ {ride.driver.rating.toFixed(1)}</div>
                  </div>
                </div>
              </div>
            )}

            {ride && ride.status === 'ACCEPTED' && (
              <div className="card" style={{marginTop:'1.5rem', border:'1px solid var(--primary)', textAlign:'center'}}>
                <p style={{fontSize:'0.8rem', opacity:0.6, marginBottom:'0.5rem'}}>Rider OTP</p>
                <h1 style={{color:'var(--primary)', letterSpacing:'5px', margin:0}}>{ride.otp}</h1>
                <p style={{fontSize:'0.7rem', marginTop:'0.5rem'}}>Give this to Captain to start</p>
              </div>
            )}

            {ride && ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED' && (
              <>
                <button className="btn btn-outline" style={{width:'100%', marginTop:'1rem'}} onClick={cancelRide}>Cancel Ride</button>
                <button className="btn btn-outline" style={{width:'100%', marginTop:'0.75rem', borderColor:'#ff4757', color:'#ff4757'}} onClick={triggerSos}>Emergency SOS</button>
              </>
            )}
          </div>
        )}

        <button className="btn btn-outline" style={{marginTop:'auto', width:'100%', opacity:0.5}} onClick={() => {localStorage.clear(); navigate('/');}}>Logout</button>
      </div>

      <div className="main-content">
        {activeTab === 'map' && (
          <div className="map-box">
            <MapContainer center={myLocation} zoom={15} style={{ height: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
              <MapRecenter bounds={routePath.length > 0 ? routePath : [myLocation]} />
              <Marker position={myLocation}><Popup>📍 Your Location</Popup></Marker>
              {!ride && <LocationPicker onSelect={onMapClick} />}
              {pickupCoords && <Marker position={pickupCoords} icon={L.icon({ iconUrl:'https://cdn-icons-png.flaticon.com/512/684/684908.png', iconSize:[30,30]})}><Popup>Pickup Point</Popup></Marker>}
              {dropCoords && <Marker position={dropCoords} icon={L.icon({ iconUrl:'https://cdn-icons-png.flaticon.com/512/149/149060.png', iconSize:[30,30]})}><Popup>Drop Point</Popup></Marker>}
              
              {/* Nearby Online Drivers */}
              {!ride && nearbyDrivers.map(d => (
                <Marker 
                  key={d.id} 
                  position={[d.currentLat, d.currentLng]} 
                  icon={L.icon({ 
                    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048329.png', 
                    iconSize: [35, 35] 
                  })}
                >
                  <Popup>🛵 Captain {d.name}</Popup>
                </Marker>
              ))}

              {driverLocation && ride && ride.status === 'ACCEPTED' && (
                <>
                  <Marker 
                    position={driverLocation} 
                    icon={L.icon({ 
                      iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048329.png', 
                      iconSize: [45, 45] 
                    })}
                  >
                    <Popup>🛵 Your Captain</Popup>
                  </Marker>
                  {/* Real Path to Pickup */}
                  {routePath.length > 0 && <Polyline positions={routePath} color="#4F46E5" weight={4} dashArray="5, 10" />}
                  <Marker position={[ride.pickupLat, ride.pickupLng]}><Popup>📍 Pickup Location</Popup></Marker>
                </>
              )}

              {ride && ride.status === 'ONGOING' && (
                <>
                  <Marker 
                    position={driverLocation || [ride.pickupLat, ride.pickupLng]} 
                    icon={L.icon({ 
                      iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048329.png', 
                      iconSize: [45, 45] 
                    })}
                  >
                    <Popup>🛵 In Progress</Popup>
                  </Marker>
                  <Marker position={[ride.dropLat, ride.dropLng]}><Popup>🏁 Destination</Popup></Marker>
                  {/* Real Path to Destination */}
                  {routePath.length > 0 && <Polyline positions={routePath} color="#10B981" weight={6} />}
                </>
              )}
            </MapContainer>
            
            {searching && <SearchingOverlay onCancel={cancelRide} />}
            
            {ride && ride.status === 'ACCEPTED' && (
              <div className="otp-card">
                <p>Share this OTP to start ride:</p>
                <div className="otp-code">{ride.otp}</div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'history' && (
          <div className="card" style={{margin:'2rem', height:'calc(100% - 4rem)', overflowY:'auto'}}>
            <h3>Ride History</h3>
            <table>
              <thead><tr><th>Date</th><th>Route</th><th>Fare</th><th>Status</th></tr></thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td>{new Date(h.createdAt).toLocaleDateString()}</td>
                    <td>{h.pickupLocation} &rarr; {h.dropLocation}</td>
                    <td>₹{h.fare}</td>
                    <td><span style={{fontSize:'0.7rem', opacity:0.6}}>{h.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'settings' && <SettingsView user={rider} setUser={setRider} role="rider" token={localStorage.getItem('riderToken')} />}
        {showSupport && <SupportModal token={localStorage.getItem('riderToken')} onClose={() => setShowSupport(false)} />}
      </div>
    </div>
  );
};

// --- Driver Dashboard ---
const DriverDashboard = () => {
  const navigate = useNavigate();
  const [driver, setDriver] = useState(JSON.parse(localStorage.getItem('driverUser')));
  const [isOnline, setIsOnline] = useState(false);
  const [ride, setRide] = useState(null);
  const [history, setHistory] = useState([]);
  const [incoming, setIncoming] = useState(null);
  const [otp, setOtp] = useState('');
  const [activeTab, setActiveTab] = useState('map');
  const [myLocation, setMyLocation] = useState([28.6200, 77.2200]); // default, overridden by GPS
  const [routePath, setRoutePath] = useState([]);
  const [showSupport, setShowSupport] = useState(false);
  const socketRef = useRef();
  const locationRef = useRef([28.6200, 77.2200]);
  const driverToken = localStorage.getItem('driverToken');

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/rides/history`, getAuthHeaders(driverToken));
      setHistory(res.data);
    } catch (error) { console.error(error); }
  }, [driverToken]);

  const refreshDriver = async () => {
    try {
      const d = await axios.get(`${API_URL}/drivers/profile`, getAuthHeaders(driverToken));
      setDriver(d.data);
      localStorage.setItem('driverUser', JSON.stringify(d.data));
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (!driver) return navigate('/');
    const historyTimer = setTimeout(() => {
      void fetchHistory();
    }, 0);
    // Get real GPS
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => {
          const loc = [pos.coords.latitude, pos.coords.longitude];
          setMyLocation(loc);
          locationRef.current = loc;
        },
        () => console.warn('GPS denied')
      );
    }
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('join', { userId: driver.id, role: 'DRIVER' });
    socketRef.current.on('newRideRequest', (req) => {
      setIncoming(req);
      toast('New Ride Request!', { icon: '🛵' });
    });
    return () => {
      clearTimeout(historyTimer);
      socketRef.current.disconnect();
    };
  }, [driver, fetchHistory, navigate]);

  useEffect(() => {
    let interval;
    if (isOnline && socketRef.current) {
      interval = setInterval(() => {
        const [lat, lng] = locationRef.current;
        socketRef.current.emit('updateLocation', { driverId: driver.id, lat, lng });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [driver?.id, isOnline]);

  const toggleOnline = async () => {
    const s = !isOnline;
    setIsOnline(s);
    await axios.patch(`${API_URL}/drivers/toggle-online`, { isOnline: s }, getAuthHeaders(driverToken));
    toast.success(s ? "You're Online!" : "You're Offline");
  };

  const updateStatus = async (s) => {
    try {
      const payload = { rideId: ride.id, status: s };
      if (s === 'ONGOING') {
        if (!otp) return toast.error('Please enter Rider OTP');
        payload.otp = otp;
      }
      const res = await axios.patch(`${API_URL}/rides/status`, payload, getAuthHeaders(driverToken));
      setRide(res.data);
      if (s === 'ONGOING') {
        setOtp('');
        const path = await fetchRoute([res.data.pickupLat, res.data.pickupLng], [res.data.dropLat, res.data.dropLng]);
        setRoutePath(path);
      }
      if (s === 'COMPLETED') {
        setRide(null);
        setRoutePath([]);
        toast.success('Ride Completed! Earnings added to wallet.');
        fetchHistory();
        refreshDriver();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const acceptRide = async () => {
    if (!incoming) return;
    try {
      const res = await axios.post(`${API_URL}/rides/accept`, { rideId: incoming.id }, getAuthHeaders(driverToken));
      const rideData = res.data;
      setRide(rideData);
      setIncoming(null);
      
      // Fetch route to pickup
      const path = await fetchRoute(myLocation, [rideData.pickupLat, rideData.pickupLng]);
      setRoutePath(path);
      
      toast.success('Ride Accepted!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to accept ride');
      setIncoming(null);
    }
  };

  const cancelRide = async () => {
    if (!ride) return;
    const reason = window.prompt('Why are you cancelling this ride?', 'Unable to proceed');
    if (!reason) return;

    try {
      const res = await axios.post(`${API_URL}/rides/cancel`, { rideId: ride.id, reason }, getAuthHeaders(driverToken));
      setRide(res.data);
      toast.success('Ride cancelled');
      void fetchHistory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to cancel ride');
    }
  };

  const triggerSos = async () => {
    if (!ride) return toast.error('No active ride to report');
    const message = window.prompt('Describe the emergency briefly', 'Unsafe situation during trip');
    if (!message) return;

    try {
      await axios.post(`${API_URL}/rides/sos`, { rideId: ride.id, message }, getAuthHeaders(driverToken));
      toast.success('Emergency alert sent to support');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send SOS');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <h2 style={{color:'var(--primary)', marginBottom:'0.5rem'}}>Chalo Captain</h2>
        <p style={{opacity:0.6, fontSize:'0.8rem', marginBottom:'2rem'}}>{driver?.email}</p>
        
        <nav style={{display:'flex', flexDirection:'column', gap:'0.5rem', marginBottom:'2rem'}}>
          <button className={`btn ${activeTab === 'map' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('map')}>🗺️ Main</button>
          <button className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('history')}>📜 History</button>
          <button className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('settings')}>⚙️ Settings</button>
        </nav>

        {activeTab === 'map' && (
          <>
            <button onClick={toggleOnline} className="btn" style={{width:'100%', background: isOnline ? 'rgba(255, 71, 87, 0.2)' : 'rgba(29, 185, 84, 0.2)', color: isOnline ? '#ff4757' : '#1db954', border: `1px solid ${isOnline ? '#ff4757' : '#1db954'}`}}>
              {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
            <div className="card" style={{marginTop:'2rem'}}>
              <p style={{fontSize:'0.8rem', opacity:0.6}}>Wallet Balance</p>
              <h2 style={{margin:'0.5rem 0'}}>₹{driver?.walletBalance?.toFixed(2) || '0.00'}</h2>
              <button className="btn btn-primary" style={{width:'100%', fontSize:'0.8rem'}} onClick={() => setActiveTab('settings')}>Request Payout</button>
            </div>
            {ride && (
              <div className="card" style={{marginTop:'1.5rem', border:'1px solid var(--primary)'}}>
                <p style={{fontSize:'0.8rem', marginBottom:'1rem'}}>Active Ride: <strong>{ride.status}</strong></p>
                {ride.status === 'ACCEPTED' && (
                  <div className="otp-input-group">
                    <input 
                      placeholder="Enter Rider OTP" 
                      value={otp} 
                      onChange={e => setOtp(e.target.value)}
                      style={{textAlign:'center', letterSpacing:'3px', fontWeight:'bold'}}
                    />
                    <button className="btn btn-primary" style={{width:'100%'}} onClick={() => updateStatus('ONGOING')}>Verify OTP & Start</button>
                  </div>
                )}
                {ride.status === 'ONGOING' && <button className="btn btn-primary" style={{width:'100%'}} onClick={() => updateStatus('COMPLETED')}>Finish Trip</button>}
                {ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED' && <button className="btn btn-outline" style={{width:'100%', marginTop:'0.75rem'}} onClick={cancelRide}>Cancel Ride</button>}
                {ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED' && <button className="btn btn-outline" style={{width:'100%', marginTop:'0.75rem', borderColor:'#ff4757', color:'#ff4757'}} onClick={triggerSos}>Emergency SOS</button>}
              </div>
            )}
          </>
        )}

        <button className="btn btn-outline" style={{width:'100%', marginBottom:'1rem'}} onClick={() => setShowSupport(true)}>Support</button>
        <button className="btn btn-outline" style={{marginTop:'auto', width:'100%'}} onClick={() => {localStorage.clear(); navigate('/');}}>Logout</button>
      </div>
      <div className="main-content">
        {activeTab === 'map' && (
          <div className="map-box">
            <MapContainer center={myLocation} zoom={15} style={{ height: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
              <MapRecenter bounds={routePath.length > 0 ? routePath : [myLocation]} />
              <Marker position={myLocation}><Popup>📍 Your Location</Popup></Marker>
              
              {ride && ride.status === 'ACCEPTED' && (
                <>
                  <Marker position={[ride.pickupLat, ride.pickupLng]}><Popup>📍 Pickup Rider Here</Popup></Marker>
                  {routePath.length > 0 && <Polyline positions={routePath} color="#4F46E5" weight={4} dashArray="5, 10" />}
                </>
              )}

              {ride && ride.status === 'ONGOING' && (
                <>
                  <Marker position={[ride.dropLat, ride.dropLng]}><Popup>🏁 Dropoff Destination</Popup></Marker>
                  {routePath.length > 0 && <Polyline positions={routePath} color="#10B981" weight={6} />}
                </>
              )}
            </MapContainer>
          </div>
        )}
        {activeTab === 'history' && (
          <div className="card" style={{margin:'2rem', height:'calc(100% - 4rem)', overflowY:'auto'}}>
            <h3>Earning History</h3>
            <table>
              <thead><tr><th>Date</th><th>Route</th><th>Fare</th><th>Earning</th></tr></thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td>{new Date(h.createdAt).toLocaleDateString()}</td>
                    <td>{h.pickupLocation} &rarr; {h.dropLocation}</td>
                    <td>₹{h.fare}</td>
                    <td style={{color:'#1db954', fontWeight:'bold'}}>₹{h.netEarning?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'settings' && <SettingsView user={driver} setUser={setDriver} role="driver" token={localStorage.getItem('driverToken')} />}
        {showSupport && <SupportModal token={localStorage.getItem('driverToken')} onClose={() => setShowSupport(false)} />}
        
        {incoming && (
          <div className="modal">
            <h3>New Request! 🛵</h3>
            <p>From: {incoming.pickupLocation}<br/>To: {incoming.dropLocation}</p>
            <div style={{display:'flex', gap:'1rem', marginTop:'1.5rem'}}>
              <button className="btn btn-primary" style={{flex:1}} onClick={acceptRide}>Accept</button>
              <button className="btn btn-outline" style={{flex:1}} onClick={() => setIncoming(null)}>Decline</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Settings View ---
const SettingsView = ({ user, setUser, role, token }) => {
  const [formData, setFormData] = useState({ ...user, password: '' });
  const [payoutAmount, setPayoutAmount] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const res = await axios.get(`${API_URL}/profile/me`, getAuthHeaders(token));
      setFormData({ ...res.data.user, password: '' });
      setUser(res.data.user);
      localStorage.setItem(`${role}User`, JSON.stringify(res.data.user));
    } catch {
      toast.error('Unable to refresh profile');
    } finally {
      setLoadingProfile(false);
    }
  }, [role, setUser, token]);

  useEffect(() => {
    const profileTimer = setTimeout(() => {
      void loadProfile();
    }, 0);

    return () => clearTimeout(profileTimer);
  }, [loadProfile]);

  const update = async () => {
    try {
      const res = await axios.patch(`${API_URL}/profile/update`, formData, getAuthHeaders(token));
      toast.success('Profile updated!');
      setUser(res.data.user);
      localStorage.setItem(`${role}User`, JSON.stringify(res.data.user));
      setFormData({ ...res.data.user, password: '' });
    } catch {
      toast.error('Update failed');
    }
  };

  const requestPayout = async () => {
    try {
      await axios.post(`${API_URL}/payouts/request`, { amount: parseFloat(payoutAmount) }, getAuthHeaders(token));
      toast.success('Payout request sent to admin!');
      setPayoutAmount('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payout request failed');
    }
  };

  return (
    <div style={{padding:'3rem', maxWidth:'800px', margin:'0 auto'}}>
      <h2 style={{marginBottom:'2rem'}}>Settings</h2>
      
      <div className="card" style={{marginBottom:'2rem'}}>
        <h4 style={{marginBottom:'1.5rem'}}>Account Details</h4>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
          <div><label style={{fontSize:'0.7rem', opacity:0.6}}>Full Name</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
          <div><label style={{fontSize:'0.7rem', opacity:0.6}}>Phone</label><input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
          <div><label style={{fontSize:'0.7rem', opacity:0.6}}>UPI ID (Payment)</label><input placeholder="yourname@upi" value={formData.upiId || ''} onChange={e => setFormData({...formData, upiId: e.target.value})} /></div>
          <div><label style={{fontSize:'0.7rem', opacity:0.6}}>Bank Account</label><input placeholder="Account number" value={formData.bankAccount || ''} onChange={e => setFormData({...formData, bankAccount: e.target.value})} /></div>
          <div><label style={{fontSize:'0.7rem', opacity:0.6}}>Emergency Contact Name</label><input placeholder="Trusted contact" value={formData.emergencyContactName || ''} onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} /></div>
          <div><label style={{fontSize:'0.7rem', opacity:0.6}}>Emergency Contact Phone</label><input placeholder="Emergency phone" value={formData.emergencyContactPhone || ''} onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})} /></div>
          <div><label style={{fontSize:'0.7rem', opacity:0.6}}>New Password</label><input type="password" placeholder="Leave blank to keep current" onChange={e => setFormData({...formData, password: e.target.value})} /></div>
        </div>
        <div style={{display:'flex', gap:'1rem', marginTop:'1.5rem'}}>
          <button className="btn btn-primary" onClick={update}>Save Changes</button>
          <button className="btn btn-outline" onClick={() => void loadProfile()} disabled={loadingProfile}>{loadingProfile ? 'Refreshing...' : 'Refresh Profile'}</button>
        </div>
      </div>

      {role === 'driver' && (
        <div className="card" style={{marginBottom:'2rem', border:'1px solid var(--primary)'}}>
          <h4>Withdraw Earnings</h4>
          <p style={{fontSize:'0.8rem', opacity:0.6, margin:'0.5rem 0 1.5rem'}}>Minimum payout: ₹100. Current Balance: ₹{user.walletBalance?.toFixed(2)}</p>
          <div style={{display:'flex', gap:'1rem'}}>
            <input type="number" placeholder="Amount" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)} style={{flex:1}} />
            <button className="btn btn-primary" onClick={requestPayout}>Request Payout</button>
          </div>
        </div>
      )}

      <div className="card" style={{opacity:0.6}}>
        <h4>About Chalo</h4>
        <p style={{fontSize:'0.8rem', marginTop:'1rem'}}>Version 2.0.0 (Premium Testing)<br/>Build: 2024.04.24<br/>© 2024 Chalo Bike-Taxi. All rights reserved.</p>
      </div>
    </div>
  );
};

// --- Admin Dashboard ---
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const getAdminHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });

  const fetchData = useCallback(async () => {
    try {
      const authHeaders = getAdminHeaders();
      const s = await axios.get(`${API_URL}/admin/stats`, authHeaders);
      const d = await axios.get(`${API_URL}/admin/drivers`, authHeaders);
      const t = await axios.get(`${API_URL}/support/all`, authHeaders);
      const p = await axios.get(`${API_URL}/payouts/all`, authHeaders);
      setStats(s.data); setDrivers(d.data); setTickets(t.data); setPayouts(p.data);
    } catch (error) { console.error(error); }
  }, []);

  useEffect(() => {
    const initialFetchTimer = setTimeout(() => {
      void fetchData();
    }, 0);
    const inv = setInterval(() => {
      void fetchData();
    }, 10000);
    return () => {
      clearTimeout(initialFetchTimer);
      clearInterval(inv);
    };
  }, [fetchData]);

  const resolveTicket = async (ticketId) => {
    await axios.patch(`${API_URL}/support/resolve`, { ticketId }, getAdminHeaders());
    toast.success('Ticket Resolved');
    fetchData();
  };

  const handlePayout = async (payoutId, status) => {
    await axios.patch(`${API_URL}/payouts/approve`, { payoutId, status }, getAdminHeaders());
    toast.success(`Payout ${status}`);
    fetchData();
  };

  return (
    <div style={{padding:'3rem', maxWidth:'1400px', margin:'0 auto'}}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'3rem'}}>
        <div>
          <h1>Admin Console</h1>
          <div style={{display:'flex', gap:'1.5rem', marginTop:'1rem'}}>
            <button className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('overview')} style={{padding:'0.5rem 1rem'}}>Overview</button>
            <button className={`btn ${activeTab === 'drivers' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('drivers')} style={{padding:'0.5rem 1rem'}}>Drivers</button>
            <button className={`btn ${activeTab === 'payouts' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('payouts')} style={{padding:'0.5rem 1rem'}}>Payouts {payouts.filter(p => p.status === 'PENDING').length > 0 && `(${payouts.filter(p => p.status === 'PENDING').length})`}</button>
            <button className={`btn ${activeTab === 'support' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('support')} style={{padding:'0.5rem 1rem'}}>Support</button>
          </div>
        </div>
        <Link to="/" className="btn btn-outline" style={{padding:'0.8rem 1.5rem'}} onClick={() => localStorage.removeItem('adminToken')}>Sign Out</Link>
      </header>

      {activeTab === 'overview' && (
        <>
          <div className="stat-grid" style={{marginBottom:'2rem'}}>
            <div className="admin-stat"><h4>Total Rides</h4><h2>{stats?.totalRides || 0}</h2></div>
            <div className="admin-stat"><h4>Total Revenue</h4><h2>₹{stats?.totalRevenue || 0}</h2></div>
            <div className="admin-stat"><h4>Open Tickets</h4><h2>{tickets.filter(t => t.status === 'OPEN').length}</h2></div>
            <div className="admin-stat"><h4>System Version</h4><h2>v2.0.0</h2></div>
          </div>
          
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem', marginTop:'2rem'}}>
            <div className="card">
              <h3>Recent Rides</h3>
              <table>
                <thead><tr><th>Rider</th><th>Fare</th><th>Status</th></tr></thead>
                <tbody>
                  {stats?.recentRides.map(r => (
                    <tr key={r.id}><td>{r.rider?.name}</td><td>₹{r.fare}</td><td>{r.status}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card">
              <h3>System Information</h3>
              <div style={{display:'flex', flexDirection:'column', gap:'1rem', marginTop:'1rem'}}>
                <div style={{display:'flex', justifyContent:'space-between'}}><span style={{opacity:0.6}}>App Version:</span> <strong>2.0.0 (Premium)</strong></div>
                <div style={{display:'flex', justifyContent:'space-between'}}><span style={{opacity:0.6}}>Build Date:</span> <strong>2024.05.12</strong></div>
                <div style={{display:'flex', justifyContent:'space-between'}}><span style={{opacity:0.6}}>Database:</span> <strong>PostgreSQL (Neon)</strong></div>
                <div style={{display:'flex', justifyContent:'space-between'}}><span style={{opacity:0.6}}>Backend Port:</span> <strong>5001</strong></div>
                <div style={{display:'flex', justifyContent:'space-between'}}><span style={{opacity:0.6}}>Socket.io:</span> <strong style={{color:'#1db954'}}>Connected</strong></div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'drivers' && (
        <div className="card">
          <h3>Verification Queue</h3>
          <table>
            <thead><tr><th>Name</th><th>License</th><th>Action</th></tr></thead>
            <tbody>
              {drivers.map(d => (
                <tr key={d.id}>
                  <td style={{fontWeight:600}}>{d.name}</td>
                  <td>{d.licenseNumber || '---'}</td>
                  <td>
                    <button className="btn btn-primary" onClick={async () => {
                      await axios.patch(`${API_URL}/admin/verify-driver`, { driverId: d.id, isVerified: !d.isVerified }, getAdminHeaders());
                      fetchData();
                    }}>{d.isVerified ? 'Block' : 'Verify'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="card">
          <h3>Payout Requests</h3>
          <table>
            <thead><tr><th>Driver</th><th>Amount</th><th>Method</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {payouts.map(p => (
                <tr key={p.id}>
                  <td>{p.driver.name}</td>
                  <td style={{fontWeight:'bold'}}>₹{p.amount}</td>
                  <td style={{fontSize:'0.8rem'}}>{p.upiId}</td>
                  <td><span style={{fontSize:'0.7rem', opacity:0.6}}>{p.status}</span></td>
                  <td>
                    {p.status === 'PENDING' && (
                      <div style={{display:'flex', gap:'0.5rem'}}>
                        <button className="btn btn-primary" style={{padding:'0.4rem 0.8rem', fontSize:'0.7rem'}} onClick={() => handlePayout(p.id, 'APPROVED')}>Approve</button>
                        <button className="btn btn-outline" style={{padding:'0.4rem 0.8rem', fontSize:'0.7rem'}} onClick={() => handlePayout(p.id, 'REJECTED')}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'support' && (
        <div className="card">
          <h3>Support Tickets</h3>
          <table>
            <thead><tr><th>User</th><th>Subject</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id}>
                  <td>{t.userName} ({t.userRole})</td>
                  <td>{t.subject}</td>
                  <td>{t.status}</td>
                  <td>
                    {t.status === 'OPEN' && <button className="btn btn-primary" onClick={() => resolveTicket(t.id)}>Resolve</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// --- Shared Support Modal ---
const SupportModal = ({ token, onClose }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const submit = async () => {
    if (!subject || !message) return toast.error('Please fill all fields');
    await axios.post(`${API_URL}/support/create`, { subject, message }, { headers: { Authorization: `Bearer ${token}` } });
    toast.success('Ticket created! Support will contact you soon.');
    onClose();
  };

  return (
    <div className="modal" style={{textAlign:'left', width:'450px'}}>
      <h3 style={{marginBottom:'1rem'}}>Contact Support 💬</h3>
      <p style={{opacity:0.6, fontSize:'0.9rem', marginBottom:'1.5rem'}}>Tell us how we can help you.</p>
      <input placeholder="Subject (e.g. Payment Issue)" onChange={e => setSubject(e.target.value)} />
      <textarea placeholder="Describe your issue..." onChange={e => setMessage(e.target.value)} style={{width:'100%', padding:'1rem', borderRadius:'1rem', background:'rgba(255,255,255,0.05)', border:'1px solid var(--glass-border)', color:'white', height:'120px', marginTop:'1rem', outline:'none', fontFamily:'inherit'}} />
      <div style={{display:'flex', gap:'1rem', marginTop:'2rem'}}>
        <button className="btn btn-primary" style={{flex:1}} onClick={submit}>Send Ticket</button>
        <button className="btn btn-outline" style={{flex:1}} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

// --- Main App ---
function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{style:{background:'#1e293b', color:'#fff', border:'1px solid rgba(255,255,255,0.1)'}}} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/:role" element={<AuthPage />} />
        <Route path="/rider-dashboard" element={<RiderDashboard />} />
        <Route path="/driver-dashboard" element={<DriverDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
