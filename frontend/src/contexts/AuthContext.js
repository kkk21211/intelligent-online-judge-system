import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(Cookies.get('token'));

  // token变化时不需要手动设置headers，api实例会自动处理

  // 检查用户登录状态
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await api.get('/api/auth/me');
          setUser(response.data.user);
        } catch (error) {
          console.error('Auth check failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = (userData, userToken) => {
    try {
      // 如果传入了用户数据和token，直接使用
      if (userData && userToken) {
        Cookies.set('token', userToken, { expires: 1 });
        setToken(userToken);
        setUser(userData);
        return;
      }
      
      // 否则抛出错误
      throw new Error('用户数据或token缺失');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginWithCredentials = async (username, password, role) => {
    try {
      const response = await api.post('/api/auth/login', {
        username,
        password,
        role
      });

      const { token: newToken, user: userData } = response.data;
      
      // 保存token到cookie
      Cookies.set('token', newToken, { expires: 7 }); // 7天过期
      setToken(newToken);
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || '登录失败'
      };
    }
  };

  const logout = () => {
    Cookies.remove('token');
    setToken(null);
    setUser(null);
    // Authorization header is handled by api interceptor
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      await api.post('/api/auth/change-password', {
        oldPassword,
        newPassword
      });
      return { success: true };
    } catch (error) {
      console.error('Change password failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || '密码修改失败'
      };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/api/auth/profile', profileData);
      updateUser(response.data.user);
      return { success: true };
    } catch (error) {
      console.error('Update profile failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || '个人信息更新失败'
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    loginWithCredentials,
    logout,
    updateUser,
    changePassword,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};