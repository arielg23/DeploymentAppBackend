import csv
import io
import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from models.assignment import Assignment, AssignmentStatus
from models.unit import Unit


async def generate_csv(db: AsyncSession, upload_id: uuid.UUID) -> str:
    result = await db.execute(
        select(Assignment)
        .options(selectinload(Assignment.technician))
        .where(
            Assignment.upload_id == upload_id,
            Assignment.status == AssignmentStatus.SENT,
        )
        .order_by(Assignment.timestamp_server)
    )
    assignments = result.scalars().all()

    # Load units for name lookup
    unit_result = await db.execute(select(Unit).where(Unit.upload_id == upload_id))
    units_map = {u.unit_id: u for u in unit_result.scalars().all()}

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "site_id", "unit_id", "unit_name", "sequence",
        "dev_eui_raw", "dev_eui_normalized",
        "technician_email", "timestamp_local", "timestamp_server",
        "status",
    ])

    for a in assignments:
        unit = units_map.get(a.unit_id)
        writer.writerow([
            a.site_id,
            a.unit_id,
            unit.unit_name if unit else "",
            unit.sequence if unit else "",
            a.dev_eui_raw,
            a.dev_eui_normalized,
            a.technician.email,
            a.timestamp_local.isoformat(),
            a.timestamp_server.isoformat(),
            a.status.value,
        ])

    return output.getvalue()
