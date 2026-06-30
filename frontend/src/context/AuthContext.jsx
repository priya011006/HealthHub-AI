import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await API.get('/api/auth/me');
        if (response.data.success) {
          // Flatten user data to make accessing names and role direct
          const userData = response.data.user;
          const profileName = userData.profile ? userData.profile.name : 'Administrator';
          const profileId = userData.profile ? userData.profile._id : null;
          
          setUser({
            id: userData.id,
            email: userData.email,
            role: userData.role,
            name: profileName,
            profileId,
            profileDetails: userData.profile
          });
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('[AuthContext] Verification failed:', error.message);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await API.post('/api/auth/login', { email, password });
      if (response.data.success) {
        const { token, user: loginUser } = response.data;
        localStorage.setItem('token', token);
        setUser(loginUser);
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please verify credentials.';
      return { success: false, message: msg };
    }
  };

  const register = async (patientData) => {
    try {
      const response = await API.post('/api/auth/register', patientData);
      if (response.data.success) {
        const { token, user: regUser } = response.data;
        localStorage.setItem('token', token);
        setUser(regUser);
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed.';
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfileState = (updatedProfile) => {
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        name: updatedProfile.name,
        profileDetails: updatedProfile
      };
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfileState }}>
      {children}
    </AuthContext.Provider>
  );
};
