import { useEffect, useState } from "react";
import { Api, getAuthToken, mapUser, setAuthToken } from "../api";

/**
 * Owns the logged-in session: restores it from a stored token on load,
 * and exposes register/login/logout. Registering does not log the user in
 * — they sign in separately afterwards, same as the useHeritageForm pattern
 * of a hook returning flat state + handlers for App to wire up.
 */
export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setAuthReady(true);
      return;
    }
    Api.me()
      .then((user) => setCurrentUser(mapUser(user)))
      .catch(() => setAuthToken(null))
      .finally(() => setAuthReady(true));
  }, []);

  const register = async (formData) => {
    setAuthBusy(true);
    try {
      await Api.register(formData);
    } finally {
      setAuthBusy(false);
    }
  };

  const login = async (email, password) => {
    setAuthBusy(true);
    try {
      const { access_token, user } = await Api.login(email, password);
      setAuthToken(access_token);
      setCurrentUser(mapUser(user));
    } finally {
      setAuthBusy(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setCurrentUser(null);
  };

  return { currentUser, authReady, authBusy, register, login, logout };
}
