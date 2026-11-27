# KisanDirect (Farmer Consumer App)

Direct farm-to-consumer agricultural marketplace with community bulk group buying, dual pricing, native Capacitor Android geolocation, and mandatory email verification.

## Project Structure

```text
Farmer Consumer App/
├── apk/                     # Versioned Android APK builds (fc-v1.0.apk, fc-v1.1.apk)
├── backend/                 # Flask REST API, SQLAlchemy models, routes, seed & tests
│   ├── routes/
│   ├── tests/
│   └── uploads/
├── docs/                    # Project presentation & documentation
├── frontend/                # React + Vite + Tailwind + Capacitor Android workspace
│   ├── android/
│   ├── dist/
│   ├── src/
│   ├── capacitor.config.json
│   ├── package.json
│   └── vite.config.js
├── unwanted/                # Separated unused assets, screenshots, legacy configs & leftovers
├── .gitignore
├── app.py                   # Production WSGI / Gunicorn entrypoint
├── gunicorn.conf.py
├── Procfile
├── requirements.txt
└── wsgi.py
```

## Development

### Backend
```bash
pip install -r requirements.txt
python backend/app.py
```

### Frontend & Android APK
```bash
cd frontend
npm install
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```
Versioned APKs are stored in `apk/` using the format `fc-v<version>.apk` (current: `apk/fc-v1.1.apk`).
