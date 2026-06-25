from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.events.publisher import EventPublisher
from invoicing.router import router as invoicing_router
from ledger.router import router as ledger_router
# import your actual broker here, like redis.asyncio as redis

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Setup
    # redis_client = await redis.from_url("redis://localhost")
    # EventPublisher.setup(redis_client)
    
    print("Application Startup: Event Broker connected.")
    
    yield # Application runs here
    
    # Teardown
    # await redis_client.close()
    print("Application Shutdown: Event Broker disconnected.")

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

 
from iam.router import router as iam_router
from payments.router import router as payments_router
 
app.include_router(iam_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(iam_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(invoicing_router, prefix="/api/v1")
app.include_router(ledger_router, prefix="/api/v1")