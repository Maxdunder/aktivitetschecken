@echo off
setlocal EnableExtensions
cd /d "%~dp0" || exit /b 1

set "PY_VERSION=3.15.2"
set "PY_DIR=%LOCALAPPDATA%\Programs\Python\Python315"
set "PY_INSTALLER=%TEMP%\python-%PY_VERSION%-amd64.exe"
set "VENV_DIR=%~dp0.venv"
set "VENV_PYTHON=%VENV_DIR%\Scripts\python.exe"

echo [1/4] Checking virtual environment...
if exist "%VENV_DIR%" (
    if not exist "%VENV_PYTHON%" (
        echo ERROR: .venv exists but does not contain Scripts\python.exe.
        echo Repair or remove the .venv folder and run this script again.
        goto :fail
    )
    goto :check_venv
)

echo Checking for Python 3.13, 3.14 or 3.15...
call :find_python
if defined PYTHON_EXE goto :create_venv

echo No Python 3.13-3.15 found. Downloading Python %PY_VERSION%...
curl.exe -L --fail -o "%PY_INSTALLER%" "https://www.python.org/ftp/python/%PY_VERSION%/python-%PY_VERSION%-amd64.exe"
if errorlevel 1 (
    echo ERROR: Could not download Python. Check your internet connection.
    goto :fail
)

echo Installing Python %PY_VERSION% for the current user...
"%PY_INSTALLER%" /quiet InstallAllUsers=0 PrependPath=1 Include_launcher=1 Include_test=0 TargetDir="%PY_DIR%"
if errorlevel 1 (
    echo ERROR: Python installation failed.
    goto :fail
)
del "%PY_INSTALLER%" >nul 2>&1
call :try_executable "%PY_DIR%\python.exe"
if not defined PYTHON_EXE (
    echo ERROR: The installed Python could not be started or has an unsupported version.
    goto :fail
)

:create_venv
echo Creating .venv using "%PYTHON_EXE%"...
"%PYTHON_EXE%" -m venv "%VENV_DIR%"
if errorlevel 1 (
    echo ERROR: Could not create the virtual environment.
    echo If .venv was partially created, remove it before trying again.
    goto :fail
)

:check_venv
"%VENV_PYTHON%" -c "import sys; sys.exit(0 if sys.prefix != sys.base_prefix and sys.version_info[:2] in ((3, 13), (3, 14), (3, 15)) else 1)"
if errorlevel 1 (
    echo ERROR: .venv is not usable or does not use Python 3.13, 3.14 or 3.15.
    echo Repair or remove the .venv folder and run this script again.
    goto :fail
)
echo Using virtual environment:
"%VENV_PYTHON%" --version
if errorlevel 1 goto :fail

echo.
echo [2/4] Checking pip...
"%VENV_PYTHON%" -m pip --version
if errorlevel 1 (
    echo ERROR: pip is unavailable in .venv.
    goto :fail
)

echo.
echo [3/4] Installing packages from requirements.txt...
"%VENV_PYTHON%" -m pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Package installation failed.
    goto :fail
)

echo.
echo [4/4] Starting main.py...
"%VENV_PYTHON%" main.py
if errorlevel 1 (
    echo ERROR: The application exited with an error.
    goto :fail
)
goto :end

:find_python
set "PYTHON_EXE="
for %%V in (3.15 3.14 3.13) do if not defined PYTHON_EXE call :try_py %%V
for %%V in (315 314 313) do if not defined PYTHON_EXE if exist "%LOCALAPPDATA%\Programs\Python\Python%%V\python.exe" call :try_executable "%LOCALAPPDATA%\Programs\Python\Python%%V\python.exe"
for /f "delims=" %%P in ('where.exe python 2^>nul') do if not defined PYTHON_EXE call :try_executable "%%P"
exit /b 0

:try_py
for /f "delims=" %%P in ('py -%1 -c "import sys; print(sys.executable)" 2^>nul') do if not defined PYTHON_EXE call :try_executable "%%P"
exit /b 0

:try_executable
"%~1" -c "import sys; sys.exit(0 if sys.version_info[:2] in ((3, 13), (3, 14), (3, 15)) else 1)" >nul 2>&1
if errorlevel 1 exit /b 0
set "PYTHON_EXE=%~1"
exit /b 0

:fail
echo.
echo Setup failed.
pause
exit /b 1

:end
echo.
pause
endlocal
