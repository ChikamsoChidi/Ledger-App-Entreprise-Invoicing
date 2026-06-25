@echo off

start cmd /k "cd backend && uvicorn main:app --reload"

start cmd /k "npm run dev"