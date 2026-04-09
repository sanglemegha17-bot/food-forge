#!/bin/bash
# Start script for Railway deployment

# Install dependencies
pip install -r requirements.txt

# Run FastAPI with Uvicorn
uvicorn app.main:app --host 0.0.0.0 --port $PORT
