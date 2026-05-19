@echo off
chcp 65001 >nul
echo.
echo ====================================
echo   百万车厘子管理系统 - 数据备份
echo ====================================
echo.

REM 设置备份目录
set BACKUP_BASE=D:\backup\baiwancheli
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_DIR=%BACKUP_BASE%\%TIMESTAMP%

REM 创建备份目录
if not exist "%BACKUP_BASE%" (
    mkdir "%BACKUP_BASE%"
)

echo [信息] 正在备份数据...
echo [源目录] D:\data\baiwancheli
echo [目标目录] %BACKUP_DIR%
echo.

REM 执行备份
xcopy "D:\data\baiwancheli" "%BACKUP_DIR%" /E /I /Y >nul

if %ERRORLEVEL% EQU 0 (
    echo [成功] 备份完成！
    echo [备份位置] %BACKUP_DIR%
    echo.
    
    REM 显示备份文件大小
    for /d %%i in ("%BACKUP_DIR%") do (
        echo [文件大小] %%~zi 字节
    )
) else (
    echo [错误] 备份失败！
    echo 请检查源目录是否存在且有读取权限
)

echo.
pause
