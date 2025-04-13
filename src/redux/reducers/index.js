// src/redux/reducers/index.js
import { combineReducers } from 'redux';
import authReducer from './authReducer';
import ticketReducer from './ticketReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  ticket: ticketReducer,
  // other reducers...
});

export default rootReducer;