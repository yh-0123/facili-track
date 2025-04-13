// src/redux/reducers/authReducer.js
import { LOGIN_USER, LOGOUT_USER, SET_USER_ROLE } from '../actionTypes';
import USER_ROLES from '../../pages/userManagement/userRolesEnum';

const initialState = {
  isLoggedIn: false,
  userRole: null,
  userData: null
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_USER:
      return {
        ...state,
        isLoggedIn: true,
        userData: action.payload,
        userRole: action.payload.userRole
      };
    case LOGOUT_USER:
      return {
        ...state,
        isLoggedIn: false,
        userData: null,
        userRole: null
      };
    case SET_USER_ROLE:
      return {
        ...state,
        userRole: action.payload
      };
    default:
      return state;
  }
};

export default authReducer;