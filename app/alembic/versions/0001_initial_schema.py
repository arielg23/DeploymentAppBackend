"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-03-05
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- technicians ---
    op.create_table(
        "technicians",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )

    # --- sites (no FK to uploads yet — circular) ---
    op.create_table(
        "sites",
        sa.Column("site_id", sa.String(), nullable=False),
        sa.Column("site_name", sa.String(), nullable=False),
        sa.Column("active_upload_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.PrimaryKeyConstraint("site_id"),
    )

    # --- technician_site_access ---
    op.create_table(
        "technician_site_access",
        sa.Column("technician_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("site_id", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["technician_id"], ["technicians.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["site_id"], ["sites.site_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("technician_id", "site_id"),
    )

    # --- uploads ---
    op.create_table(
        "uploads",
        sa.Column("upload_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("site_id", sa.String(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("INACTIVE", "ACTIVE", "COMPLETE", name="upload_status"),
            nullable=False,
            server_default="INACTIVE",
        ),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("uploaded_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["site_id"], ["sites.site_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["uploaded_by"], ["technicians.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("upload_id"),
    )

    # Partial unique index: only one ACTIVE upload per site
    op.create_index(
        "uix_one_active_upload_per_site",
        "uploads",
        ["site_id"],
        unique=True,
        postgresql_where=sa.text("status = 'ACTIVE'"),
    )

    # Now add the FK from sites.active_upload_id → uploads.upload_id
    op.create_foreign_key(
        "fk_site_active_upload",
        "sites",
        "uploads",
        ["active_upload_id"],
        ["upload_id"],
        use_alter=True,
    )

    # --- units ---
    op.create_table(
        "units",
        sa.Column("upload_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("unit_id", sa.String(), nullable=False),
        sa.Column("site_id", sa.String(), nullable=False),
        sa.Column("unit_name", sa.String(), nullable=False),
        sa.Column("sequence", sa.Integer(), nullable=False),
        sa.Column("customer_name", sa.String(), nullable=True),
        sa.Column("customer_id", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["upload_id"], ["uploads.upload_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["site_id"], ["sites.site_id"]),
        sa.PrimaryKeyConstraint("upload_id", "unit_id"),
    )

    # --- skip_reasons ---
    op.create_table(
        "skip_reasons",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("label", sa.String(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default="true"),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- assignments ---
    op.create_table(
        "assignments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("upload_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("site_id", sa.String(), nullable=False),
        sa.Column("unit_id", sa.String(), nullable=False),
        sa.Column("dev_eui_raw", sa.String(), nullable=False),
        sa.Column("dev_eui_normalized", sa.String(16), nullable=False),
        sa.Column("technician_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("timestamp_local", sa.DateTime(timezone=True), nullable=False),
        sa.Column("timestamp_server", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column(
            "status",
            sa.Enum("QUEUED", "SENT", "CONFLICT", "ERROR", name="assignment_status"),
            nullable=False,
            server_default="SENT",
        ),
        sa.ForeignKeyConstraint(["upload_id"], ["uploads.upload_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["site_id"], ["sites.site_id"]),
        sa.ForeignKeyConstraint(["technician_id"], ["technicians.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("dev_eui_normalized", "upload_id", name="uq_deveui_per_upload"),
        sa.UniqueConstraint("site_id", "unit_id", "upload_id", name="uq_unit_per_upload"),
    )

    # --- skips ---
    op.create_table(
        "skips",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("upload_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("site_id", sa.String(), nullable=False),
        sa.Column("unit_id", sa.String(), nullable=False),
        sa.Column("technician_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("reason_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["upload_id"], ["uploads.upload_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["site_id"], ["sites.site_id"]),
        sa.ForeignKeyConstraint(["technician_id"], ["technicians.id"]),
        sa.ForeignKeyConstraint(["reason_id"], ["skip_reasons.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("skips")
    op.drop_table("assignments")
    op.drop_table("skip_reasons")
    op.drop_table("units")
    op.drop_constraint("fk_site_active_upload", "sites", type_="foreignkey")
    op.drop_index("uix_one_active_upload_per_site", table_name="uploads")
    op.drop_table("uploads")
    op.drop_table("technician_site_access")
    op.drop_table("sites")
    op.drop_table("technicians")
    op.execute("DROP TYPE IF EXISTS upload_status")
    op.execute("DROP TYPE IF EXISTS assignment_status")
