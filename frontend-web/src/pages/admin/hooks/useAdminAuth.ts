import { useEffect, useState } from "react";
import { apiCheckSession, apiLogin, apiLogout } from "../admin.api";

export function useAdminAuth() {
  const [autenticado, setAutenticado] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const checkSession = async () => {
    try {
      setCheckingSession(true);
      const { res, json } = await apiCheckSession();

      if (!res.ok) {
        setAutenticado(false);
        return;
      }

      setAutenticado(!!json?.ok);
    } catch (e) {
      console.error(e);
      setAutenticado(false);
    } finally {
      setCheckingSession(false);
    }
  };

  const login = async () => {
    try {
      if (!username.trim() || !password.trim()) {
        alert("Debes ingresar usuario y contraseña.");
        return;
      }

      setLoginLoading(true);

      const { res, json } = await apiLogin(username.trim(), password);

      if (!res.ok || !json?.ok) {
        alert(json?.error || "No se pudo iniciar sesión");
        return;
      }

      setPassword("");
      setAutenticado(true);
    } catch (e) {
      console.error(e);
      alert("Error iniciando sesión.");
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (e) {
      console.error(e);
    } finally {
      setAutenticado(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  return {
    autenticado,
    checkingSession,
    username,
    password,
    loginLoading,
    setUsername,
    setPassword,
    setAutenticado,
    login,
    logout,
    checkSession,
  };
}