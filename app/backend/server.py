from fastapi import FastAPI, APIRouter, HTTPException, Depends, File, UploadFile, status
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)

# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    department: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    role: str = "staff"
    department: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TokenResponse(BaseModel):
    token: str
    user: User

class VendorCreate(BaseModel):
    name: str
    type: str # barang, jasa, customer
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class Vendor(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str = "barang"
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AgreementCreate(BaseModel):
    title: str
    vendor_id: str
    category: str
    start_date: str
    expiry_date: str
    cycle_year: Optional[int] = None
    description: Optional[str] = None
    file_name: Optional[str] = None

class AgreementUpdate(BaseModel):
    title: Optional[str] = None
    vendor_id: Optional[str] = None
    category: Optional[str] = None
    start_date: Optional[str] = None
    expiry_date: Optional[str] = None
    cycle_year: Optional[int] = None
    description: Optional[str] = None
    
class AgreementReject(BaseModel):
    reason: str

class Agreement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    vendor_id: str
    vendor_name: Optional[str] = None
    category: str
    start_date: str
    expiry_date: str
    cycle_year: Optional[int] = None
    description: Optional[str] = None
    file_path: Optional[str] = None
    status: str
    approval_status: str = "pending"
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    department: Optional[str] = None
    created_by: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ExpiryDistribution(BaseModel):
    active_over_1_year: int
    expiring_6_12_months: int
    expiring_3_6_months: int
    expiring_1_3_months: int
    expiring_soon_1_month: int
    expired: int

class DashboardStats(BaseModel):
    total_agreements: int
    active_agreements: int
    expiring_soon: int
    expired_agreements: int
    total_vendors: int
    expiry_distribution: ExpiryDistribution

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    agreement_id: str
    agreement_title: str
    message: str
    type: str
    is_read: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def calculate_agreement_status(expiry_date_str: str) -> str:
    try:
        # Handle both ISO format with and without timezone
        if expiry_date_str.endswith('Z'):
            expiry_date = datetime.fromisoformat(expiry_date_str.replace('Z', '+00:00'))
        elif '+' in expiry_date_str or expiry_date_str.endswith('00:00'):
            expiry_date = datetime.fromisoformat(expiry_date_str)
        else:
            # Assume UTC if no timezone info
            expiry_date = datetime.fromisoformat(expiry_date_str).replace(tzinfo=timezone.utc)
        
        now = datetime.now(timezone.utc)
        days_until_expiry = (expiry_date - now).days
        
        if days_until_expiry < 0:
            return "expired"
        elif days_until_expiry <= 30:
            return "expiring_soon"
        else:
            return "active"
    except Exception as e:
        print(f"Error calculating status for date {expiry_date_str}: {e}")
        return "active"

# Auth Routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = {
        "id": str(uuid.uuid4()),
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "role": "staff",
        "department": user_data.department,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_dict)
    user = User(**{k: v for k, v in user_dict.items() if k != 'password_hash'})
    token = create_token(user.id)
    
    return TokenResponse(token=token, user=user)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_obj = User(**{k: v for k, v in user.items() if k != 'password_hash'})
    token = create_token(user_obj.id)
    
    return TokenResponse(token=token, user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

# Vendor Routes
@api_router.get("/vendors", response_model=List[Vendor])
async def get_vendors(
    type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if type:
        query['type'] = type
    return await db.vendors.find(query, {"_id": 0}).to_list(1000)

@api_router.post("/vendors", response_model=Vendor)
async def create_vendor(vendor_data: VendorCreate, current_user: dict = Depends(get_current_user)):
    vendor_dict = vendor_data.model_dump()
    vendor = Vendor(**vendor_dict)
    await db.vendors.insert_one(vendor.model_dump())
    return vendor

@api_router.put("/vendors/{vendor_id}", response_model=Vendor)
async def update_vendor(vendor_id: str, vendor_data: VendorCreate, current_user: dict = Depends(get_current_user)):
    result = await db.vendors.find_one_and_update(
        {"id": vendor_id},
        {"$set": vendor_data.model_dump()},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return Vendor(**{k: v for k, v in result.items() if k != '_id'})

@api_router.delete("/vendors/{vendor_id}")
async def delete_vendor(vendor_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.vendors.delete_one({"id": vendor_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return {"message": "Vendor deleted successfully"}

# Agreement Routes
@api_router.get("/agreements", response_model=List[Agreement])
async def get_agreements(
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    cycle_year: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    # Department Scoping
    if current_user['role'] != 'admin':
        # If user has no department, they see nothing? Or maybe a default "General" department?
        # For now, if they have a department, filter by it.
        # If they don't (creation issue), maybe they see nothing or all?
        # Safer to show nothing or only their own created items if dept is missing.
        # Let's filter by department if set.
        if current_user.get('department'):
            query["department"] = current_user['department']
    
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"vendor_name": {"$regex": search, "$options": "i"}}
        ]
        
    if cycle_year:
        query["cycle_year"] = cycle_year
    
    agreements = await db.agreements.find(query, {"_id": 0}).to_list(1000)
    
    # Update status for each agreement
    for agreement in agreements:
        agreement['status'] = calculate_agreement_status(agreement['expiry_date'])
    
    # Filter by status if provided
    if status:
        agreements = [a for a in agreements if a['status'] == status]
    
    return agreements

@api_router.get("/agreements/{agreement_id}", response_model=Agreement)
async def get_agreement(agreement_id: str, current_user: dict = Depends(get_current_user)):
    agreement = await db.agreements.find_one({"id": agreement_id}, {"_id": 0})
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
    
    agreement['status'] = calculate_agreement_status(agreement['expiry_date'])
    return Agreement(**agreement)

@api_router.post("/agreements", response_model=Agreement)
async def create_agreement(agreement_data: AgreementCreate, current_user: dict = Depends(get_current_user)):
    # Get vendor name
    vendor = await db.vendors.find_one({"id": agreement_data.vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    agreement_dict = agreement_data.model_dump()
    agreement_dict['id'] = str(uuid.uuid4())
    agreement_dict['vendor_name'] = vendor['name']
    agreement_dict['status'] = calculate_agreement_status(agreement_data.expiry_date)
    agreement_dict['department'] = current_user.get('department')
    agreement_dict['approval_status'] = 'pending'
    agreement_dict['created_by'] = current_user['id']
    agreement_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    agreement_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.agreements.insert_one(agreement_dict)
    
    # Create notification if expiring soon
    if agreement_dict['status'] == 'expiring_soon':
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": current_user['id'],
            "agreement_id": agreement_dict['id'],
            "agreement_title": agreement_dict['title'],
            "message": f"Agreement '{agreement_dict['title']}' is expiring soon",
            "type": "expiry_warning",
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification)
    
    return Agreement(**agreement_dict)

@api_router.put("/agreements/{agreement_id}", response_model=Agreement)
async def update_agreement(
    agreement_id: str,
    agreement_data: AgreementUpdate,
    current_user: dict = Depends(get_current_user)
):
    existing = await db.agreements.find_one({"id": agreement_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Agreement not found")
    
    update_dict = {k: v for k, v in agreement_data.model_dump().items() if v is not None}
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # Update vendor name if vendor_id changed
    if 'vendor_id' in update_dict:
        vendor = await db.vendors.find_one({"id": update_dict['vendor_id']}, {"_id": 0})
        if vendor:
            update_dict['vendor_name'] = vendor['name']
    
    result = await db.agreements.find_one_and_update(
        {"id": agreement_id},
        {"$set": update_dict},
        return_document=True
    )
    
    result['status'] = calculate_agreement_status(result['expiry_date'])
    return Agreement(**{k: v for k, v in result.items() if k != '_id'})

@api_router.delete("/agreements/{agreement_id}")
async def delete_agreement(agreement_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.agreements.delete_one({"id": agreement_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agreement not found")
    return {"message": "Agreement deleted successfully"}

@api_router.post("/agreements/{agreement_id}/upload")
async def upload_agreement_file(
    agreement_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    agreement = await db.agreements.find_one({"id": agreement_id})
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
    
    # Validate file type
    allowed_extensions = ['.pdf', '.doc', '.docx']
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Only PDF and DOC files are allowed")
    
    # Save file
    file_name = f"{agreement_id}_{file.filename}"
    file_path = UPLOADS_DIR / file_name
    
    with file_path.open('wb') as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update agreement
    await db.agreements.update_one(
        {"id": agreement_id},
        {"$set": {"file_path": str(file_path)}}
    )
    
    return {"message": "File uploaded successfully", "file_path": str(file_path)}

@api_router.get("/agreements/{agreement_id}/download")
async def download_agreement(agreement_id: str, current_user: dict = Depends(get_current_user)):
    agreement = await db.agreements.find_one({"id": agreement_id})
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
        
    if current_user['role'] != 'admin' and agreement.get('department') and agreement.get('department') != current_user.get('department'):
         raise HTTPException(status_code=403, detail="Access denied")

    if not agreement.get('file_path'):
        raise HTTPException(status_code=404, detail="No file uploaded")

    file_path = Path(agreement['file_path'])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on server")
        
    return FileResponse(file_path, filename=file_path.name)

@api_router.get("/agreements/{agreement_id}/preview")
async def preview_agreement(agreement_id: str, current_user: dict = Depends(get_current_user)):
    agreement = await db.agreements.find_one({"id": agreement_id})
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
        
    if current_user['role'] != 'admin' and agreement.get('department') and agreement.get('department') != current_user.get('department'):
         raise HTTPException(status_code=403, detail="Access denied")

    if not agreement.get('file_path'):
        raise HTTPException(status_code=404, detail="No file uploaded")

    file_path = Path(agreement['file_path'])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on server")
        
    return FileResponse(file_path, content_disposition_type="inline")

@api_router.put("/agreements/{agreement_id}/approve", response_model=Agreement)
async def approve_agreement(agreement_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only admin can approve")
    
    result = await db.agreements.find_one_and_update(
        {"id": agreement_id},
        {"$set": {
            "approval_status": "approved",
            "approved_by": current_user['name'],
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "rejection_reason": None
        }},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Agreement not found")
        
    result['status'] = calculate_agreement_status(result['expiry_date'])
    return Agreement(**{k: v for k, v in result.items() if k != '_id'})

@api_router.put("/agreements/{agreement_id}/reject", response_model=Agreement)
async def reject_agreement(agreement_id: str, reject_data: AgreementReject, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only admin can reject")
    
    result = await db.agreements.find_one_and_update(
        {"id": agreement_id},
        {"$set": {
            "approval_status": "rejected",
            "rejection_reason": reject_data.reason,
            "approved_by": current_user['name'], # Track who rejected too
            "approved_at": datetime.now(timezone.utc).isoformat()
        }},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Agreement not found")
    
    # Create notification for the creator
    creator_id = result.get('created_by')
    if creator_id:
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": creator_id,
            "agreement_id": agreement_id,
            "agreement_title": result['title'],
            "message": f"Agreement '{result['title']}' was rejected: {reject_data.reason}",
            "type": "rejection",
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification)
        
    result['status'] = calculate_agreement_status(result['expiry_date'])
    return Agreement(**{k: v for k, v in result.items() if k != '_id'})

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user['role'] != 'admin' and current_user.get('department'):
        query['department'] = current_user['department']
        
    all_agreements = await db.agreements.find(query, {"_id": 0}).to_list(1000)
    
    total_agreements = len(all_agreements)
    active_count = 0
    expiring_soon_count = 0 # Standard "expiring soon" (<= 30 days)
    expired_count = 0
    
    # Distribution buckets
    dist_expired = 0
    dist_soon_1_month = 0
    dist_1_3_months = 0
    dist_3_6_months = 0
    dist_6_12_months = 0
    dist_active_over_1_year = 0

    now = datetime.now(timezone.utc)
    
    for agreement in all_agreements:
        # Calculate status using existing helper for general stats
        status = calculate_agreement_status(agreement['expiry_date'])
        if status == 'active':
            active_count += 1
        elif status == 'expiring_soon':
            expiring_soon_count += 1
        elif status == 'expired':
            expired_count += 1
            
        # Create detailed distribution
        try:
            expiry_date_str = agreement['expiry_date']
            if expiry_date_str.endswith('Z'):
                expiry_date = datetime.fromisoformat(expiry_date_str.replace('Z', '+00:00'))
            elif '+' in expiry_date_str or expiry_date_str.endswith('00:00'):
                expiry_date = datetime.fromisoformat(expiry_date_str)
            else:
                expiry_date = datetime.fromisoformat(expiry_date_str).replace(tzinfo=timezone.utc)
            
            days_until_expiry = (expiry_date - now).days
            
            if days_until_expiry < 0:
                dist_expired += 1
            elif days_until_expiry <= 30:
                dist_soon_1_month += 1
            elif days_until_expiry <= 90:
                dist_1_3_months += 1
            elif days_until_expiry <= 180:
                dist_3_6_months += 1
            elif days_until_expiry <= 365:
                dist_6_12_months += 1
            else:
                dist_active_over_1_year += 1

        except Exception as e:
            print(f"Error calculating distribution for date {agreement.get('expiry_date')}: {e}")
            # Fallback based on status if date parsing fails, though unlikely given prior check
            if status == 'expired':
                dist_expired += 1
            elif status == 'expiring_soon':
                dist_soon_1_month += 1
            else:
                dist_active_over_1_year += 1

    total_vendors = await db.vendors.count_documents({})
    
    return DashboardStats(
        total_agreements=total_agreements,
        active_agreements=active_count,
        expiring_soon=expiring_soon_count,
        expired_agreements=expired_count,
        total_vendors=total_vendors,
        expiry_distribution=ExpiryDistribution(
            active_over_1_year=dist_active_over_1_year,
            expiring_6_12_months=dist_6_12_months,
            expiring_3_6_months=dist_3_6_months,
            expiring_1_3_months=dist_1_3_months,
            expiring_soon_1_month=dist_soon_1_month,
            expired=dist_expired
        )
    )

# Notification Routes
@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user['id']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return notifications

@api_router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user['id']},
        {"$set": {"is_read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

# Create default admin user on startup
@app.on_event("startup")
async def create_default_admin():
    existing_admin = await db.users.find_one({"email": "admin@company.com"})
    if not existing_admin:
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": "admin@company.com",
            "password_hash": hash_password("Admin123!"),
            "name": "Admin User",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        logging.info("Default admin user created: admin@company.com / Admin123!")

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()