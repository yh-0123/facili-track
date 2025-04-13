// src/redux/actions/authActions.js
import { LOGIN_USER, LOGOUT_USER, SET_USER_ROLE } from '../actionTypes';
import Cookies from 'js-cookie';

export const loginUser = (userData) => {
  // Save user data to cookie
  Cookies.set('userData', JSON.stringify(userData));
  
  return {
    type: LOGIN_USER,
    payload: userData
  };
};

export const logoutUser = () => {
  // Remove user data from cookie
  Cookies.remove('userData');
  
  return {
    type: LOGOUT_USER
  };
};

export const setUserRole = (role) => {
  return {
    type: SET_USER_ROLE,
    payload: role
  };
};
