#!/bin/bash
docker compose up -d
echo ""
echo "Services starting..."
echo "  Postgres:   localhost:5432"
echo "  MongoDB:    localhost:27017"
echo "  PowerSync:  localhost:8080"
echo ""
echo "Run 'npm run dev' to start the app on localhost:3000"
