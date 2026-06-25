from sqlalchemy.orm import Session
from sqlalchemy.engine import Row
from typing import List
from sqlalchemy import func

from ledger.models import Account, JournalEntry, LedgerLine, EntryType
from ledger.schemas import JournalEntryInput, LineItemInput
from ledger.exceptions import UnbalancedJournalEntryError, InvalidAccountError


class LedgerService:
    
    @staticmethod
    def post_journal_entry(db: Session, entry_data: JournalEntryInput) -> JournalEntry:
        """
        Validates and permanently records a double-entry transaction.
        
        This method computes total debits and credits. If they do not balance,
        it raises an UnbalancedJournalEntryError and prevents the save.
        """
        total_debits = 0
        total_credits = 0

        # 1. Calculate and verify balancing totals
        for line in entry_data.lines:
            if line.entry_type == EntryType.DEBIT:
                total_debits += line.amount
            elif line.entry_type == EntryType.CREDIT:
                total_credits += line.amount

        if total_debits != total_credits:
            raise UnbalancedJournalEntryError(
                f"Transaction unbalanced. Total Debits: {total_debits} Kobo, "
                f"Total Credits: {total_credits} Kobo. Difference must be zero."
            )

        # 2. Verify all accounts exist for safety
        account_ids = [line.account_id for line in entry_data.lines]
        existing_accounts_count = db.query(Account.id).filter(Account.id.in_(account_ids)).count()
        
        if existing_accounts_count != len(set(account_ids)):
            raise InvalidAccountError("One or more account IDs provided do not exist.")

        # 3. Create the parent Journal Entry record
        # Multi-tenancy context handles tenant_id injection automatically
        journal_entry = JournalEntry(
            reference_id=entry_data.reference_id,
            description=entry_data.description
        )
        db.add(journal_entry)
        db.flush()  # Extract the journal_entry.id for the lines

        # 4. Create the individual ledger lines
        for line in entry_data.lines:
            ledger_line = LedgerLine(
                journal_entry_id=journal_entry.id,
                account_id=line.account_id,
                amount=line.amount,
                entry_type=line.entry_type
            )
            db.add(ledger_line)

        # 5. Commit the transaction atomically
        db.commit()
        db.refresh(journal_entry)
        
        return journal_entry

    @staticmethod
    def get_account_balance(db: Session, account_id: str) -> int:
        """
        Calculates the real-time balance of a specific account.
        
        Asset and Expense accounts increase with Debits and decrease with Credits.
        Liability, Equity, and Revenue increase with Credits and decrease with Debits.
        """
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise InvalidAccountError("Account not found.")

        # Aggregate amounts categorized by type
        lines = db.query(LedgerLine.entry_type, func.sum(LedgerLine.amount).label("total")).filter(
            LedgerLine.account_id == account_id
        ).group_by(LedgerLine.entry_type).all()

        totals = {EntryType.DEBIT: 0, EntryType.CREDIT: 0}
        for row in lines:
            totals[row.entry_type] = row.total or 0

        # Apply standard accounting normal balance math
        from ledger.models import AccountType
        if account.account_type in [AccountType.ASSET, AccountType.EXPENSE]:
            return totals[EntryType.DEBIT] - totals[EntryType.CREDIT]
        else:
            return totals[EntryType.CREDIT] - totals[EntryType.DEBIT]