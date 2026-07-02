import axios from "axios";
import appConfig from "../config";
import { getGuestProfile, saveGuestProfile, clearGuestProfile } from "../utils/guestProfile";
import {
  SET_PROFILE,
  PROFILE_ERROR,
  LOADING_PROFILE,
  LOGOUT,
  CLEAR_PROFILE,
} from "./types";

const getToken = () => localStorage.getItem("token");

const useGuestMode = () => !getToken();

// Get Profile
export const getProfile = () => async (dispatch) => {
  try {
    dispatch({ type: LOADING_PROFILE });

    if (useGuestMode()) {
      const profile = getGuestProfile();
      dispatch({ type: SET_PROFILE, payload: profile });
      return profile;
    }

    const axiosConfig = {
      headers: { "x-auth-token": getToken() },
    };

    const res = await axios.get(`${appConfig.backendUrl}/api/profile/me`, axiosConfig);

    dispatch({ type: SET_PROFILE, payload: res.data });
    return res.data;
  } catch (err) {
    if (!useGuestMode() && err.response?.status === 400) {
      try {
        const defaultProfile = getGuestProfile();
        const createRes = await axios.post(
          `${appConfig.backendUrl}/api/profile`,
          defaultProfile,
          { headers: { "x-auth-token": getToken() } }
        );
        dispatch({ type: SET_PROFILE, payload: createRes.data });
        return createRes.data;
      } catch (createErr) {
        console.error("Error creating default profile:", createErr);
      }
    }

    if (useGuestMode()) {
      const profile = getGuestProfile();
      dispatch({ type: SET_PROFILE, payload: profile });
      return profile;
    }

    dispatch({
      type: PROFILE_ERROR,
      payload: err.response?.data?.msg || "Error fetching profile",
    });
    return null;
  }
};

// Update Profile
export const updateProfile = (profileData) => async (dispatch) => {
  try {
    dispatch({ type: LOADING_PROFILE });

    const processedData = {
      ...profileData,
      age: Number(profileData.age) || 0,
      height: Number(profileData.height) || 0,
      weight: Number(profileData.weight) || 0,
      targetWeight: Number(profileData.targetWeight) || 0,
      dailyBudget: Number(profileData.dailyBudget) || 0,
      profileIcon: profileData.profileIcon || "bear",
      allergies: Array.isArray(profileData.allergies)
        ? profileData.allergies
        : profileData.allergies
            ?.split(",")
            .map((a) => a.trim())
            .filter(Boolean) || [],
    };

    if (useGuestMode()) {
      const saved = saveGuestProfile(processedData);
      dispatch({ type: SET_PROFILE, payload: saved });
      return true;
    }

    const axiosConfig = {
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": getToken(),
      },
    };

    const res = await axios.post(
      `${appConfig.backendUrl}/api/profile`,
      processedData,
      axiosConfig
    );

    dispatch({ type: SET_PROFILE, payload: res.data });
    return true;
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: err.response?.data?.msg || "Error updating profile",
    });
    return false;
  }
};

// Change Password — not available in guest mode
export const changePassword = (newPassword) => async (dispatch) => {
  if (useGuestMode()) {
    dispatch({
      type: PROFILE_ERROR,
      payload: "Password change is not available in guest mode.",
    });
    return false;
  }

  try {
    if (!newPassword || newPassword.length < 6) {
      dispatch({
        type: PROFILE_ERROR,
        payload: "Password must be at least 6 characters",
      });
      return false;
    }

    await axios.put(
      `${appConfig.backendUrl}/api/profile/updatepassword`,
      { password: newPassword },
      {
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": getToken(),
        },
      }
    );

    return true;
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: err.response?.data?.msg || "Error updating password",
    });
    return false;
  }
};

// Delete Account — clears guest profile locally
export const deleteAccount = () => async (dispatch) => {
  if (useGuestMode()) {
    clearGuestProfile();
    dispatch({ type: CLEAR_PROFILE });
    return true;
  }

  try {
    await axios.delete(`${appConfig.backendUrl}/api/profile`, {
      headers: { "x-auth-token": getToken() },
    });
    dispatch({ type: CLEAR_PROFILE });
    dispatch({ type: LOGOUT });
    return true;
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: err.response?.data?.msg || "Error deleting account",
    });
    return false;
  }
};

// Generate Diet Suggestions
export const generateDietSuggestions = () => async (dispatch) => {
  try {
    dispatch({ type: LOADING_PROFILE });

    if (useGuestMode()) {
      dispatch({ type: SET_PROFILE, payload: getGuestProfile() });
      return { message: "Diet suggestions require a connected account." };
    }

    const res = await axios.post(
      `${appConfig.backendUrl}/api/profile/generate-diet`,
      {},
      { headers: { "x-auth-token": getToken() } }
    );

    await dispatch(getProfile());
    return res.data;
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: err.response?.data?.msg || "Error generating diet suggestions",
    });
    return null;
  }
};
