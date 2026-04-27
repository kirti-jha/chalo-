import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import api from '../api/api';
import socket from '../utils/socket';
import { AuthContext } from '../context/AuthContext';

const DriverHomeScreen = () => {
  const { user } = useContext(AuthContext);
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState(null);
  const [incomingRide, setIncomingRide] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();

    socket.on('newRideRequest', (ride) => {
      setIncomingRide(ride);
    });

    return () => {
      socket.off('newRideRequest');
    };
  }, []);

  useEffect(() => {
    let interval;
    if (isOnline && location) {
      interval = setInterval(() => {
        socket.emit('updateLocation', {
          driverId: user.id,
          lat: location.latitude,
          lng: location.longitude,
        });
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isOnline, location]);

  const toggleOnline = async () => {
    try {
      const newStatus = !isOnline;
      await api.patch('/drivers/toggle-online', { isOnline: newStatus });
      setIsOnline(newStatus);
    } catch (error) {
      Alert.alert('Error updating status');
    }
  };

  const handleAcceptRide = async () => {
    try {
      await api.post('/rides/accept', { rideId: incomingRide.id });
      setIncomingRide(null);
      Alert.alert('Ride Accepted!', 'Navigate to pickup location.');
    } catch (error) {
      Alert.alert('Error accepting ride');
    }
  };

  return (
    <View style={styles.container}>
      {location && (
        <MapView
          style={styles.map}
          region={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker coordinate={location} title="You" />
        </MapView>
      )}

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Status: <Text style={{ color: isOnline ? 'green' : 'red' }}>{isOnline ? 'Online' : 'Offline'}</Text>
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: isOnline ? '#ff4444' : '#44bb44' }]}
          onPress={toggleOnline}
        >
          <Text style={styles.buttonText}>{isOnline ? 'Go Offline' : 'Go Online'}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={!!incomingRide} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Ride Request!</Text>
            <Text>Pickup: {incomingRide?.pickupLocation}</Text>
            <Text>Drop: {incomingRide?.dropLocation}</Text>
            <Text>Fare: ₹{incomingRide?.fare}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptRide}>
                <Text style={styles.btnText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => setIncomingRide(null)}>
                <Text style={styles.btnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  statusContainer: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 30,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: { fontSize: 16, fontWeight: 'bold', marginRight: 15 },
  button: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', margin: 30, padding: 20, borderRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  acceptBtn: { backgroundColor: '#44bb44', padding: 15, borderRadius: 10, flex: 0.45, alignItems: 'center' },
  rejectBtn: { backgroundColor: '#ff4444', padding: 15, borderRadius: 10, flex: 0.45, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
});

export default DriverHomeScreen;
