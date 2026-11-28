import os
import sys
from decimal import Decimal
from datetime import datetime, date

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment

from backend.models import (
    User, FarmerProfile, BuyerProfile, Address, Category, Product,
    Community, CommunityMember, BulkCampaign, CampaignTargetCommunity,
    CommunityOrder, CommunityOrderItem, CommunityReview,
    Order, FarmerOrder, OrderItem, ProductReview, OrderFeedback,
)


def _serialize_val(val):
    if isinstance(val, Decimal):
        return float(val)
    if isinstance(val, (datetime, date)):
        return val.isoformat()
    return val


def export_all_tables_to_excel(output_path=None):
    """Export all core MySQL tables into a multi-sheet .xlsx workbook."""
    if output_path is None:
        output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'kisandirect_database_export.xlsx'))

    wb = openpyxl.Workbook()
    wb.remove(wb.active)

    header_fill = PatternFill(start_color='1B5E20', end_color='1B5E20', fill_type='solid')
    header_font = Font(color='FFFFFF', bold=True)

    models = [
        ('Users', User),
        ('FarmerProfiles', FarmerProfile),
        ('BuyerProfiles', BuyerProfile),
        ('Addresses', Address),
        ('Categories', Category),
        ('Products', Product),
        ('Communities', Community),
        ('CommunityMembers', CommunityMember),
        ('BulkCampaigns', BulkCampaign),
        ('CampaignTargets', CampaignTargetCommunity),
        ('CommunityOrders', CommunityOrder),
        ('CommunityOrderItems', CommunityOrderItem),
        ('CommunityReviews', CommunityReview),
        ('Orders', Order),
        ('FarmerOrders', FarmerOrder),
        ('OrderItems', OrderItem),
        ('ProductReviews', ProductReview),
        ('OrderFeedback', OrderFeedback),
    ]

    for sheet_name, model in models:
        ws = wb.create_sheet(title=sheet_name[:31])
        cols = [c.name for c in model.__table__.columns if c.name != 'password_hash']
        ws.append(cols)
        for col_idx in range(1, len(cols) + 1):
            cell = ws.cell(row=1, column=col_idx)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal='center', vertical='center')

        rows = model.query.all()
        for row_obj in rows:
            row_vals = [_serialize_val(getattr(row_obj, c)) for c in cols]
            ws.append(row_vals)

        for col in ws.columns:
            max_len = max((len(str(cell.value or '')) for cell in col), default=10)
            ws.column_dimensions[col[0].column_letter].width = min(max(max_len + 3, 12), 45)

    wb.save(output_path)
    return output_path


if __name__ == '__main__':
    from backend.app import create_app
    app = create_app()
    with app.app_context():
        path = export_all_tables_to_excel()
        print(f"Exported database to: {path}")
