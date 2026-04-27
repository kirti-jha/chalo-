import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import socket from '../utils/socket';

const RideTrackingScreen = ({ route }) => {
  const { ride } = route.params;
  const [driverLocation, setDriverLocation] = useState({
    latitude: ride.driver.currentLat || ride.pickupLat,
    longitude: ride.driver.currentLng || ride.pickupLng,
  });
  const [status, setStatus] = useState(ride.status);

  useEffect(() => {
    socket.on('driverLocationUpdate', (data) => {
      if (data.driverId === ride.driverId) {
        setDriverLocation({
          latitude: data.lat,
          longitude: data.lng,
        });
      }
    });

    socket.on('rideStatusUpdate', (updatedRide) => {
      if (updatedRide.id === ride.id) {
        setStatus(updatedRide.status);
      }
    });

    return () => {
      socket.off('driverLocationUpdate');
      socket.off('rideStatusUpdate');
    };
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          ...driverLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={driverLocation} title="Driver" />
        <Marker
          coordinate={{ latitude: ride.pickupLat, longitude: ride.pickupLng }}
          title="Pickup"
          pinColor="green"
        />
      </MapView>

      <View style={styles.infoContainer}>
        <Text style={styles.statusText}>Status: {status}</Text>
        <Text>Driver: {ride.driver.name}</Text>
        <Text>Vehicle: {ride.driver.vehicleNumber}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  infoContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  statusText: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
});

export default RideTrackingScreen;
