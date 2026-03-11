# 🏃‍♂️ Proyecto de Rutinas de Entrenamiento (Frontend + Backend)

# para arrancar npx estudio
npx prisma studio

## 🧱 Requisitos

- Node.js (v18 o superior)
- npm
- Git

---

## 🔧 1. Clonar el proyecto

```bash
git clone <URL-del-repo>
cd <carpeta-del-proyecto>
```

---

## ⚙️ 2. Configurar y ejecutar el backend (API con Express + Prisma + SQLite)

```bash
cd backend
npm install
```

### ⚠️ Verifica que tengas `schema.prisma` en `backend/prisma/`

Ahora genera la base de datos SQLite:

```bash
npx prisma migrate dev --name init
```

(Opcional para inspeccionar base de datos)

```bash
npx prisma studio
```

### Ejecutar servidor

```bash
node index.js
```

> 📍 El backend estará disponible en: `http:///api`

---

## 🌐 3. Ejecutar el frontend (Vite + React)

```bash
cd ../frontend
npm install
npm run dev
```

> 🌍 El frontend estará disponible en: `http:///api:5173`

---

## 📝 Datos útiles

- La base de datos es local con SQLite (`backend/prisma/dev.db`)
- Los usuarios se almacenan con nombre, email, rol (`alumno` o `instructor`) y contraseña.
- Las rutinas se asignan desde el dashboard del instructor.
- El alumno solo ve sus propias rutinas.

- Agregar nuevo campo en el backend
```
npx prisma migrate dev --name add-dias-a-rutina

docker compose down -v
docker compose up --build

---