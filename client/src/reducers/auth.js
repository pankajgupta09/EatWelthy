import {
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
  GOOGLE_AUTO,
  EMAIL_VERIFICATION_SUCCESS,
  EMAIL_VERIFICATION_FAIL,
  UPDATE_NAME_SUCCESS,
  UPDATE_NAME_FAIL
} from "../actions/types";

import { getGuestProfile } from "../utils/guestProfile";

const guestProfile = getGuestProfile();
const guestUser = {
  _id: "guest",
  name: guestProfile.name || "Guest",
  email: "guest@eatwelthy.local",
  isVerified: true,
};

const initialState = {
  token: null,
  isAuthenticated: true,
  loading: false,
  user: guestUser,
  googleAuto: false,
};

export default function authReducer(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case USER_LOADED:
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: payload || guestUser,
      };
    case REGISTER_SUCCESS:
      return {
        ...state,
        ...payload,
        isAuthenticated: true,
        loading: false,
        user: guestUser,
      };
    case LOGIN_SUCCESS:
      return {
        ...state,
        ...payload,
        isAuthenticated: true,
        loading: false,
        user: guestUser,
      };
    case UPDATE_NAME_SUCCESS:
      return {
        ...state,
        user: { ...state.user, ...payload },
        loading: false
      };
    case UPDATE_NAME_FAIL:
      return {
        ...state,
        loading: false
      };
    case EMAIL_VERIFICATION_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: { ...state.user, isVerified: true },
        loading: false
      };
    case EMAIL_VERIFICATION_FAIL:
      return {
        ...state,
        loading: false
      };
    case REGISTER_FAIL:
    case AUTH_ERROR:
    case LOGIN_FAIL:
    case LOGOUT:
      return {
        ...state,
        token: null,
        isAuthenticated: true,
        loading: false,
        googleAuto: false,
        user: guestUser,
      };
    case GOOGLE_AUTO:
      return {
        ...state,
        googleAuto: true
      };
    default:
      return state;
  }
}
