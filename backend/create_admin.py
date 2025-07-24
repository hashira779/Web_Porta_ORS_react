from app.db.session import SessionLocal
from app.models.user import UserDB
from app.core.security import get_password_hash

def create_first_user():
    db = SessionLocal()
    
    # Check if any user already exists
    if db.query(UserDB).first():
        print("A user already exists. Skipping creation.")
        return

    print("Creating first admin user...")
    
    # Create the admin user
    # NOTE: In a real application, get these from environment variables or a secure input
    admin_user = UserDB(
        username="admin",
        email="admin@example.com",
        hashed_password=get_password_hash("admin123"),
        role_id=1,  # Assuming 1 is the 'admin' role ID
        is_active=True
    )
    
    db.add(admin_user)
    db.commit()
    
    print("Admin user created successfully!")
    print("Username: admin")
    print("Password: admin123")
    
    db.close()

if __name__ == "__main__":
    create_first_user()