from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from ledger.services import LedgerService
from ledger.schemas import JournalEntryInput
from ledger.exceptions import (
    UnbalancedJournalEntryError,
    InvalidAccountError
)

router = APIRouter(
    prefix="/ledger",
    tags=["Ledger"]
)


@router.post(
    "/journal-entries",
    status_code=status.HTTP_201_CREATED
)
def create_journal_entry(
    payload: JournalEntryInput,
    db: Session = Depends(get_db)
):
    """
    Post a balanced journal entry.
    """

    try:
        entry = LedgerService.post_journal_entry(db, payload)

        return {
            "message": "Journal entry posted successfully.",
            "journal_entry_id": str(entry.id),
            "reference_id": entry.reference_id
        }

    except UnbalancedJournalEntryError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except InvalidAccountError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/accounts/{account_id}/balance")
def get_account_balance(
    account_id: str,
    db: Session = Depends(get_db)
):
    """
    Get live computed account balance.
    """

    try:
        balance = LedgerService.get_account_balance(
            db,
            account_id
        )

        return {
            "account_id": account_id,
            "balance": balance
        }

    except InvalidAccountError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )