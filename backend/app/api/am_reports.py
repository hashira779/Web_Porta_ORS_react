from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta
import pandas as pd
import io
import telegram

from app.db.session import get_db
from app.core.secure_api import require_api_key_with_scope
from app.crud import crud_sales
from app.models.api_key import APIKey

# --- Configuration ---
# In a real application, this token should be stored securely (e.g., in environment variables)
TELEGRAM_BOT_TOKEN = "8173994331:AAEirobZkclbSooy5CvZcwkLSQkw0rxLxw0"

router = APIRouter()
bot = telegram.Bot(token=TELEGRAM_BOT_TOKEN)


@router.post(
    "/reports/sales/send-telegram",
    summary="Generate and Send Sales Report via Telegram",
    tags=["On-Demand Reports"]
)
async def send_sales_report_telegram(
        *,
        request: Request,
        start_date: date = Query(..., description="Start date in YYYY-MM-DD format"),
        end_date: date = Query(..., description="End date in YYYY-MM-DD format"),
        db: Session = Depends(get_db),
        _ = Depends(require_api_key_with_scope("am_sales_report"))
):
    """
    For the user associated with the provided API key, this generates a detailed
    sales report, creates an Excel file, and sends it via Telegram.
    """
    key_owner = getattr(request.state, "api_key_owner", None)

    if not key_owner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This API key is not assigned to a user.")

    if not key_owner.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The user associated with this API key does not have a Telegram account linked.")

    # Check for allowed roles
    allowed_roles = ['area', 'owner']
    if not key_owner.role or key_owner.role.name.lower() not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied. This key's owner does not have a valid role."
        )

    # 1. Get Sales Data
    sales_data = crud_sales.get_sales_for_user(
        db=db, user=key_owner, start_date=start_date, end_date=end_date
    )

    if not sales_data:
        # Optionally, send a message saying no data was found
        await bot.send_message(
            chat_id=key_owner.user_id,
            text=f"No sales data found for the period: {start_date} to {end_date}."
        )
        return {"message": "No sales data found. A notification has been sent to the user."}

    # 2. Create Excel File in Memory
    df = pd.DataFrame(sales_data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Sales Report')
    excel_data = output.getvalue()

    # 3. Send to Telegram
    file_name = f"sales_report_{start_date}_to_{end_date}.xlsx"

    try:
        await bot.send_document(
            chat_id=key_owner.user_id,
            document=io.BytesIO(excel_data),
            filename=file_name,
            caption=f"Here is your sales report for the period: {start_date} to {end_date}."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send report via Telegram: {e}")

    return {"message": f"Report has been successfully sent to {key_owner.username} via Telegram."}