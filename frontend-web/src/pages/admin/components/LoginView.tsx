import React from "react";
import { btnLogin, input, loginBox, loginContainer } from "../admin.styles";

type Props = {
  username: string;
  password: string;
  loginLoading: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onLogin: () => void;
};

export function LoginView({
  username,
  password,
  loginLoading,
  onUsernameChange,
  onPasswordChange,
  onLogin,
}: Props) {
  return (
    <div style={loginContainer}>
      <div style={loginBox}>
        <h2>Acceso Administrativo</h2>

        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          style={input}
        />

        <input
          type="password"
          placeholder="Clave de administrador"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          style={{ ...input, marginTop: "0.75rem" }}
          onKeyDown={(e) => {
            if (e.key === "Enter") onLogin();
          }}
        />

        <button onClick={onLogin} style={btnLogin} disabled={loginLoading}>
          {loginLoading ? "Ingresando..." : "Ingresar"}
        </button>
      </div>
    </div>
  );
}