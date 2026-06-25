from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from core.database import get_db
from iam.models import User, Tenant, TenantMember
from iam.schemas import UserSignupRequest, UserSignupResponse, UserLoginRequest, UserLoginResponse
from core.security import get_password_hash, verify_password, create_access_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserSignupResponse, status_code=status.HTTP_201_CREATED)
def register_new_sme(request: UserSignupRequest, db: Session = Depends(get_db)):

    # 1. Pre-flight check: does the email already exist?
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    try:
        # 2. Create the User
        hashed_pw = get_password_hash(request.password)
        new_user = User(email=request.email, password_hash=hashed_pw)
        db.add(new_user)
        db.flush()  # Get new_user.id without committing yet

        # 3. Create the Company Workspace (Tenant)
        new_tenant = Tenant(name=request.company_name)
        db.add(new_tenant)
        db.flush()  # Get new_tenant.id

        # 4. Assign the Owner role
        new_member = TenantMember(
            tenant_id=new_tenant.id,
            user_id=new_user.id,
            role="Owner"
        )
        db.add(new_member)
        db.commit()

        # 5. Issue the JWT
        access_token = create_access_token(data={
            "sub": str(new_user.id),
            "tenant_id": str(new_tenant.id)
        })

        return UserSignupResponse(
            user_id=str(new_user.id),
            tenant_id=str(new_tenant.id),
            message="Registration successful. Welcome aboard!",
            access_token=access_token
        )

    except HTTPException:
        db.rollback()
        raise  # re-raise as-is, don't swallow it
    except Exception as e:
        db.rollback()
        logger.error(f"Signup transaction failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed due to an internal error.")

@router.post("/login", response_model=UserLoginResponse)
def login(request: UserLoginRequest, db: Session = Depends(get_db)):

    # 1. Look up the user
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Fetch their active tenant membership
    membership = db.query(TenantMember).filter(
        TenantMember.user_id == user.id,
        TenantMember.is_active == True
    ).first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No active workspace found for this user."
        )

    # 3. Issue the JWT with both user and tenant context
    access_token = create_access_token(data={
        "sub": str(user.id),
        "tenant_id": str(membership.tenant_id)
    })

    return UserLoginResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=str(user.id),
        tenant_id=str(membership.tenant_id)
    )