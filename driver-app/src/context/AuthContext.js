import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';
import socket from '../utils/socket';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const token = await AsyncStorage.getItem('token');
    const userData = await AsyncStorage.getItem('user');
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      socket.connect();
      socket.emit('join', { userId: parsedUser.id, role: 'DRIVER' });
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/driver/login', { email, password });
    const { driver, token } = response.data;
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(driver));
    setUser(driver);
    socket.connect();
    socket.emit('join', { userId: driver.id, role: 'DRIVER' });
  };

  const logout = async () => {
    await AsyncStorage.clear();
    setUser(null);
    socket.disconnect();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
