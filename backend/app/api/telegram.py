import csv
import io
import logging
import telegram
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.models import user as user_model, station as station_model, role as role_model
from app.schemas.telegram import SendReportRequest
from app.core.security import get_current_active_user
from sqlalchemy.orm import joinedload

TELEGRAM_BOT_TOKEN = "8173994331:AAEirobZkclbSooy5CvZcwkLSQkw0rxLxw0"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
bot = telegram.Bot(token=TELEGRAM_BOT_TOKEN)

def get_current_admin_user(current_user: user_model.User = Depends(get_current_active_user)):
    if not current_user.role or current_user.role.name.lower() != 'admin':
        raise HTTPException(status_code=403, detail="You do not have permission for this action.")
    return current_user

@router.post("/reports/send-telegram", tags=["Telegram"], summary="Generate and dispatch user-specific raw data reports via Telegram")
async def send_telegram_report(
        report_request: SendReportRequest,
        db: Session = Depends(get_db),
        admin_user: user_model.User = Depends(get_current_admin_user)
):
    target_roles = db.query(role_model.Role).filter(role_model.Role.name.in_(report_request.roles)).all()
    if not target_roles:
        raise HTTPException(status_code=404, detail=f"No roles found with the names: {report_request.roles}.")

    role_ids = [role.id for role in target_roles]
    users_to_notify = db.query(user_model.User).filter(
        user_model.User.role_id.in_(role_ids),
        user_model.User.user_id.isnot(None)
    ).options(
        joinedload(user_model.User.role),
        joinedload(user_model.User.managed_areas).joinedload(station_model.Area.stations),
        joinedload(user_model.User.owned_stations)
    ).all()

    if not users_to_notify:
        return {"message": "No users found for the selected roles with a linked Telegram account."}

    successful_deliveries = 0
    failed_deliveries = []

    start_year, end_year = report_request.start_date.year, report_request.end_date.year
    years_to_query = list(range(start_year, end_year + 1))
    available_summary_years = [2023, 2024, 2025]
    union_parts = []

    base_select_fields = "STATION_ID, STATION AS station_name, total_valume, date_completed AS COMPLETED_TS, PAYMENT, total_amount"

    for year in years_to_query:
        if year in available_summary_years:
            table_name = f"summary_station_{year}_materialized"
            union_parts.append(f"(SELECT {base_select_fields} FROM {table_name})")

    if not union_parts:
        raise HTTPException(status_code=400, detail="No data tables available for the selected date range.")
    base_query_for_union = " UNION ALL ".join(union_parts)

    for user in users_to_notify:
        try:
            output = io.StringIO()
            writer = csv.writer(output)

            # CHANGE 1: Added "Station ID" to the CSV header
            writer.writerow(["Date", "Station ID", "Station Name", "Volume (Liters)", "Amount", "Payment Type"])

            station_ids = []
            if user.role.name.lower() == 'area':
                station_ids = [s.station_ID for area in user.managed_areas for s in area.stations if s.station_ID]
            elif user.role.name.lower() == 'owner':
                station_ids = [s.station_ID for s in user.owned_stations if s.station_ID]

            if not station_ids:
                logger.warning(f"Skipping user '{user.username}' as they have no assigned stations.")
                continue

            # CHANGE 2: Added STATION_ID to the SELECT statement
            sales_query = text(f"""
                SELECT
                    STATION_ID,
                    station_name,
                    total_valume,
                    COMPLETED_TS,
                    PAYMENT,
                    total_amount
                FROM ({base_query_for_union}) as sales_data
                WHERE COMPLETED_TS BETWEEN :start_date AND :end_date AND STATION_ID IN :station_ids
                ORDER BY COMPLETED_TS, station_name
            """)

            sales_results = db.execute(sales_query, {
                "start_date": report_request.start_date, "end_date": report_request.end_date, "station_ids": station_ids
            }).fetchall()

            if not sales_results:
                writer.writerow(["No raw data found for your stations in this period.", "", "", "", "", ""])
            else:
                # CHANGE 3: Added the station_ID value to each row
                for row in sales_results:
                    writer.writerow([
                        row._mapping['COMPLETED_TS'],
                        row._mapping['STATION_ID'], # Added Station ID here
                        row._mapping['station_name'],
                        f"{row._mapping['total_valume'] or 0:,.2f}",
                        f"{row._mapping['total_amount'] or 0:,.2f}",
                        row._mapping['PAYMENT']
                    ])

            output.seek(0)
            csv_data = output.getvalue().encode('utf-8')
            csv_file = io.BytesIO(csv_data)
            file_name = f"raw_data_report_{report_request.start_date}_to_{report_request.end_date}.csv"
            csv_file.name = file_name

            await bot.send_message(chat_id=user.user_id, text=f"📊 Raw Data Report Attached\nPeriod: {report_request.start_date} to {report_request.end_date}")
            await bot.send_document(chat_id=user.user_id, document=csv_file, filename=file_name)

            successful_deliveries += 1

        except Exception as e:
            error_message = str(e)
            logger.error(f"Failed to send report to user '{user.username}' (ID: {user.user_id}): {error_message}")
            failed_deliveries.append({"username": user.username, "user_id": user.user_id, "error": "Database query or internal error."})


    total_attempts = len(users_to_notify)
    summary_message = f"Dispatch completed. Sent: {successful_deliveries}/{total_attempts}. Failed: {len(failed_deliveries)}."

    return { "message": summary_message, "success_count": successful_deliveries, "failures": failed_deliveries }