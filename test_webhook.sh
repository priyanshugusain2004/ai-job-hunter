#!/bin/bash
# Trigger the n8n application assistant webhook
curl -X POST http://localhost:9005/webhook-test/application-assistant \
     -H "Content-Type: application/json" \
     -d '{
       "resume_id": "27b0dc8b-ac6a-43df-9f07-4a55e047b353",
       "job_description": "We are seeking a Backend Software Developer who knows Python, FastAPI, and Docker."
     }'
echo ""
