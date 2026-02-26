@echo off
echo Starting all food platform services...

start "Backend" cmd /k "npm run dev:backend"
start "Customer App" cmd /k "npm run dev:customer"
start "Delivery App" cmd /k "npm run dev:delivery"
start "Restaurant App" cmd /k "npm run dev:restaurant"
start "Admin App" cmd /k "npm run dev:admin"

echo Waiting 5 seconds for services to start...
timeout /t 5 /nobreak > NUL

echo Opening localhost links in browser...
start http://localhost:5173
start http://localhost:5174
start http://localhost:5175
start http://localhost:5176

echo All services started successfully!
