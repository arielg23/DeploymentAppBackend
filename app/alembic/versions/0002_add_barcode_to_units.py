"""add barcode to units

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-07
"""
from alembic import op
import sqlalchemy as sa

revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('units', sa.Column('barcode', sa.String(), nullable=True))
    op.create_index('ix_units_barcode_upload', 'units', ['upload_id', 'barcode'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_units_barcode_upload', table_name='units')
    op.drop_column('units', 'barcode')
