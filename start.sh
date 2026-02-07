#!/bin/bash

# Build and deploy Kaeee webapp (production)
cd "$(dirname "$0")"

echo "Building production bundle..."
npm run build

echo ""
echo "==================================="
echo "  Kaeee production build complete!"
echo "==================================="
echo ""
echo "  Caddy serves static files from dist/"
echo "  Managed by: systemctl --user status kaeee-caddy"
echo ""
echo "  To restart Caddy:"
echo "    systemctl --user restart kaeee-caddy"
echo ""
