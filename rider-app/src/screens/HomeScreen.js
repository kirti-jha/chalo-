import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location'; // Or react-native-geolocation-service
import api from '../api/api';
import socket from '../utils/socket';
import { AuthContext } from '../context/AuthContext';

const HomeScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [region, setRegion] = useState(null);
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();

    socket.on('rideAccepted', (ride) => {
      setBooking(false);
      navigation.navigate('RideTracking', { ride });
    });

    return () => {
      socket.off('rideAccepted');
    };
  }, []);

  const geocodeLocation = async (query) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const handleBookRide = async () => {
    if (!pickup || !drop) {
      Alert.alert('Please enter pickup and drop locations');
      return;
    }

    setBooking(true);
    try {
      const pickupCoords = await geocodeLocation(pickup);
      const dropCoords = await geocodeLocation(drop);

      if (!pickupCoords || !dropCoords) {
        Alert.alert('Could not find one or both locations. Please be more specific.');
        setBooking(false);
        return;
      }

      const response = await api.post('/rides/request', {
        pickupLocation: pickup,
        dropLocation: drop,
        pickupLat: pickupCoords.lat,
        pickupLng: pickupCoords.lng,
        dropLat: dropCoords.lat,
        dropLng: dropCoords.lng,
        fare: 50,
      });
      
      setRegion({
        latitude: pickupCoords.lat,
        longitude: pickupCoords.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      
      console.log('Ride requested:', response.data);
    } catch (error) {
      setBooking(false);
      Alert.alert('Error booking ride');
    }
  };

  return (
    <View style={styles.container}>
      {region && (
        <MapView style={styles.map} region={region}>
          <Marker coordinate={region} title="You are here" />
        </MapView>
      )}

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Pickup Location"
          value={pickup}
          onChangeText={setPickup}
        />
        <TextInput
          style={styles.input}
          placeholder="Drop Location"
          value={drop}
          onChangeText={setDrop}
        />
        <TouchableOpacity style={styles.button} onPress={handleBookRide} disabled={booking}>
          <Text style={styles.buttonText}>{booking ? 'Searching Drivers...' : 'Book Ride'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  searchContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#FFDD00', // Rapido yellow
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: { fontWeight: 'bold', fontSize: 16 },
});

export default HomeScreen;
