#!/bin/bash

# Cricsheet Data Downloader
# Downloads cricket match data in JSON format

DOWNLOAD_DIR="$HOME/Downloads/cricsheet_data"
mkdir -p "$DOWNLOAD_DIR"
cd "$DOWNLOAD_DIR"

echo "🏏 Cricsheet Data Downloader"
echo "=============================="
echo ""
echo "Available datasets:"
echo "1. IPL (Indian Premier League) - ~1000+ matches"
echo "2. T20I (International T20s) - ~3000+ matches"
echo "3. ODI (One Day Internationals) - ~5000+ matches"
echo "4. Test (Test Matches) - ~2500+ matches"
echo "5. All formats (Warning: ~50GB download!)"
echo ""
echo "Downloads will be saved to: $DOWNLOAD_DIR"
echo ""

# IPL Data
echo "Downloading IPL data..."
if [ ! -f "ipl_male_json.zip" ]; then
    curl -L "https://cricsheet.org/downloads/ipl_male_json.zip" -o "ipl_male_json.zip"
    echo "✅ IPL data downloaded"
else
    echo "⏭️  IPL data already exists"
fi

# T20I Data
echo ""
echo "Downloading T20I data..."
if [ ! -f "t20s_male_json.zip" ]; then
    curl -L "https://cricsheet.org/downloads/t20s_male_json.zip" -o "t20s_male_json.zip"
    echo "✅ T20I data downloaded"
else
    echo "⏭️  T20I data already exists"
fi

# ODI Data
echo ""
echo "Downloading ODI data..."
if [ ! -f "odis_male_json.zip" ]; then
    curl -L "https://cricsheet.org/downloads/odis_male_json.zip" -o "odis_male_json.zip"
    echo "✅ ODI data downloaded"
else
    echo "⏭️  ODI data already exists"
fi

# Test Data
echo ""
echo "Downloading Test data..."
if [ ! -f "tests_male_json.zip" ]; then
    curl -L "https://cricsheet.org/downloads/tests_male_json.zip" -o "tests_male_json.zip"
    echo "✅ Test data downloaded"
else
    echo "⏭️  Test data already exists"
fi

echo ""
echo "=============================="
echo "📦 Extracting files..."
echo ""

# Extract all
for file in *.zip; do
    if [ -f "$file" ]; then
        echo "Extracting $file..."
        unzip -q -o "$file"
        echo "✅ Extracted $file"
    fi
done

echo ""
echo "=============================="
echo "✅ Download complete!"
echo ""
echo "Downloaded data location: $DOWNLOAD_DIR"
echo ""
echo "File counts:"
find "$DOWNLOAD_DIR" -name "*.json" -type f | wc -l | xargs echo "  Total JSON files:"
[ -d "ipl_male_json" ] && find "ipl_male_json" -name "*.json" -type f | wc -l | xargs echo "  IPL matches:"
[ -d "t20s_male_json" ] && find "t20s_male_json" -name "*.json" -type f | wc -l | xargs echo "  T20I matches:"
[ -d "odis_male_json" ] && find "odis_male_json" -name "*.json" -type f | wc -l | xargs echo "  ODI matches:"
[ -d "tests_male_json" ] && find "tests_male_json" -name "*.json" -type f | wc -l | xargs echo "  Test matches:"
echo ""
echo "Next step: Run 'node bulk-upload.js' to upload to your database"
