@echo off
chcp 65001 >nul
echo.
echo ====================================
echo   百万车厘子管理系统 - 启动脚本
echo ====================================
echo.

REM 检查Node.js是否安装
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到Node.js，请先安装Node.js
    echo 下载地址：https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [信息] Node.js版本:
node -v
echo.

REM 检查依赖是否已安装
if not exist "node_modules" (
    echo [1/3] 首次运行，正在安装依赖...
    call npm install --production
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [错误] 依赖安装失败，请检查网络连接
        pause
        exit /b 1
    )
    echo [完成] 依赖安装成功
    echo.
) else (
    echo [1/3] 依赖已安装，跳过...
    echo.
)

REM 检查数据目录是否存在
if not exist "D:\data\baiwancheli" (
    echo [2/3] 初始化数据文件...
    call npm run init
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [错误] 数据初始化失败
        pause
        exit /b 1
    )
    echo [完成] 数据初始化成功
    echo.
) else (
    echo [2/3] 数据文件已存在，跳过初始化...
    echo.
)

set NODE_ENV=production
echo [3/3] 启动服务...
echo.
echo ====================================
echo   服务地址: http://localhost:3000
echo   数据目录: D:\data\baiwancheli
echo   按 Ctrl+C 停止服务
echo ====================================
echo.

npm start

pause
