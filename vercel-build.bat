@echo off
set NODE_OPTIONS=--max_old_space_size=4096
set ROLLUP_SKIP_PLATFORM_CHECK=true
set npm_config_platform=neutral
set npm_config_arch=neutral
set npm_config_libc=neutral
set npm_config_optional=false
set npm_config_ignore_scripts=true
npm run build:vercel