#!/bin/bash

if [ $# -eq 0 ]; then
    echo "Usage: ./switch-theme.sh <theme_name> [-l]"
    echo "Available themes: default, gruvbox, dracula, Nord, Monokai, Mocha, Solarized, Paraiso"
    echo "Use -l flag to force light mode"
    exit 1
fi

theme=$1
light_mode=false

if [ "$2" = "-l" ]; then
    light_mode=true
fi

node -e "
const themes = require('./themes.json');
const config = require('./config.json');
if (themes['$theme']) {
    if ('$light_mode' === 'true') {
        config.colors.light = themes['$theme'].light;
        config.colors.dark = themes['$theme'].light;
        console.log('Theme switched to: $theme (light mode)');
    } else {
        config.colors = themes['$theme'];
        console.log('Theme switched to: $theme');
    }
    require('fs').writeFileSync('./config.json', JSON.stringify(config, null, 2));
} else {
    console.log('Theme not found: $theme');
    console.log('Available themes:', Object.keys(themes).join(', '));
}
" 