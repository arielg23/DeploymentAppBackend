import uuid

from fastapi import APIRouter, Depends, Form, HTTPException, Request, UploadFile, File, status
from fastapi.responses import HTMLResponse, RedirectResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_db
from core.security import hash_password, verify_password
from models.assignment import Assignment, AssignmentStatus
from models.site import Site
from models.skip import Skip
from models.skip_reason import SkipReason
from models.technician import Technician, TechnicianSiteAccess
from models.unit import Unit
from models.upload import Upload, UploadStatus
from services.excel_parser import parse_and_create_upload
from services.export_service import generate_csv
from services.upload_service import activate_upload, complete_upload

router = APIRouter(prefix='/admin')
templates = Jinja2Templates(directory='admin/templates')
_signer = URLSafeTimedSerializer(settings.secret_key)
SESSION_COOKIE = 'admin_session'
SESSION_MAX_AGE = 3600 * 8


def _set_session(response, technician_id: str):
    token = _signer.dumps(technician_id)
    response.set_cookie(SESSION_COOKIE, token, httponly=True, samesite='strict', max_age=SESSION_MAX_AGE)


async def get_admin(request: Request, db: AsyncSession = Depends(get_db)) -> Technician:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(status_code=303, headers={'Location': '/admin/login'})
    try:
        technician_id = _signer.loads(token, max_age=SESSION_MAX_AGE)
    except (BadSignature, SignatureExpired):
        raise HTTPException(status_code=303, headers={'Location': '/admin/login'})
    result = await db.execute(select(Technician).where(Technician.id == technician_id, Technician.active == True))
    technician = result.scalar_one_or_none()
    if not technician:
        raise HTTPException(status_code=303, headers={'Location': '/admin/login'})
    return technician


@router.get('/login', response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse('login.html', {'request': request, 'error': None})


@router.post('/login')
async def login_submit(request: Request, email: str = Form(...), password: str = Form(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Technician).where(Technician.email == email, Technician.active == True))
    technician = result.scalar_one_or_none()
    if not technician or not verify_password(password, technician.password_hash):
        return templates.TemplateResponse('login.html', {'request': request, 'error': 'Invalid credentials'})
    response = RedirectResponse('/admin/', status_code=302)
    _set_session(response, str(technician.id))
    return response


@router.get('/logout')
async def logout():
    response = RedirectResponse('/admin/login', status_code=302)
    response.delete_cookie(SESSION_COOKIE)
    return response


@router.get('/', response_class=HTMLResponse)
async def dashboard(request: Request, admin: Technician = Depends(get_admin), db: AsyncSession = Depends(get_db)):
    sites_result = await db.execute(select(Site).order_by(Site.site_name))
    sites = sites_result.scalars().all()
    site_stats = []
    for site in sites:
        stat = {'site': site, 'upload': None, 'total': 0, 'assigned': 0, 'skipped': 0, 'conflicts': 0}
        if site.active_upload_id:
            upload_result = await db.execute(select(Upload).where(Upload.upload_id == site.active_upload_id))
            upload = upload_result.scalar_one_or_none()
            stat['upload'] = upload
            if upload:
                stat['total'] = (await db.execute(select(func.count()).where(Unit.upload_id == upload.upload_id))).scalar()
                stat['assigned'] = (await db.execute(select(func.count()).where(Assignment.upload_id == upload.upload_id, Assignment.status == AssignmentStatus.SENT))).scalar()
                stat['skipped'] = (await db.execute(select(func.count()).where(Skip.upload_id == upload.upload_id))).scalar()
                stat['conflicts'] = (await db.execute(select(func.count()).where(Assignment.upload_id == upload.upload_id, Assignment.status == AssignmentStatus.CONFLICT))).scalar()
        site_stats.append(stat)
    return templates.TemplateResponse('dashboard.html', {'request': request, 'admin': admin, 'site_stats': site_stats})


@router.get('/uploads', response_class=HTMLResponse)
async def uploads_list(request: Request, admin: Technician = Depends(get_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Upload).order_by(Upload.uploaded_at.desc()))
    uploads = result.scalars().all()
    return templates.TemplateResponse('uploads.html', {'request': request, 'admin': admin, 'uploads': uploads})


@router.get('/uploads/new', response_class=HTMLResponse)
async def upload_new_page(request: Request, admin: Technician = Depends(get_admin), db: AsyncSession = Depends(get_db)):
    sites_result = await db.execute(select(Site).order_by(Site.site_name))
    sites = sites_result.scalars().all()
    return templates.TemplateResponse('upload_new.html', {'request': request, 'admin': admin, 'sites': sites, 'error': None})


@router.post('/uploads/new')
async def upload_new_submit(request: Request, site_id: str = Form(...), file: UploadFile = File(...), admin: Technician = Depends(get_admin), db: AsyncSession = Depends(get_db)):
    try:
        res = await parse_and_create_upload(db, file.file, site_id, admin.id)
    except HTTPException as e:
        sites_result = await db.execute(select(Site).order_by(Site.site_name))
        sites = sites_result.scalars().all()
        return templates.TemplateResponse('upload_new.html', {'request': request, 'admin': admin, 'sites': sites, 'error': str(e.detail)})
    return RedirectResponse(f'/admin/uploads/{res["upload_id"]}', status_code=302)


@router.get('/uploads/{upload_id}', response_class=HTMLResponse)
async def upload_detail(upload_id: uuid.UUID, request: Request, admin: Technician = Depends(get_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Upload).where(Upload.upload_id == upload_id))
    upload = result.scalar_one_or_none()
    if not upload:
        raise HTTPException(status_code=404, detail='Upload not found')
    total = (await db.execute(select(func.count()).where(Unit.upload_id == upload_id))).scalar()
    assigned = (await db.execute(select(func.count()).where(Assignment.upload_id == upload_id, Assignment.status == AssignmentStatus.SENT))).scalar()
    skipped = (await db.execute(select(func.count()).where(Skip.upload_id == upload_id))).scalar()
    conflicts = (await db.execute(select(func.count()).where(Assignment.upload_id == upload_id, Assignment.status == AssignmentStatus.CONFLICT))).scalar()
    return templates.TemplateResponse('upload_detail.html', {'request': request, 'admin': admin, 'upload': upload, 'total': total, 'assigned': assigned, 'skipped': skipped, 'conflicts': conflicts})


@router.post('/uploads/{upload_id}/activate')
async def do_activate(upload_id: uuid.UUID, admin: Technician = Depends(get_admin), db: AsyncSession = Depends(get_db)):
    await activate_upload(db, upload_id)
    return RedirectResponse(f'/admin/uploads/{upload_id}', status_code=302)


@router.post('/uploads/{upload_id}/complete')
async def do_complete(upload_id: uuid.UUID, admin: Technician = Depends(get_admin), db: AsyncSession = Depends(get_db)):
    await complete_upload(db, upload_id)
    return RedirectResponse(f'/admin/uploads/{upload_id}', status_code=302)


@router.get('/uploads/{upload_id}/export')
async def admin_export(upload_id: uuid.UUID, admin: Technician = Depends(get_admin), db: AsyncSession = Depends(get_db)):
    csv_content = await generate_csv(db, upload_id)
    return StreamingResponse(iter([csv_content]), media_type='text/csv', headers={'Content-Disposition': f'attachment; filename=upload_{upload_id}.csv'})


@router.get('/sites', response_class=HTMLResponse)
async def sites_page(request: Request, admin: Technician = Depends(get_admin), db: AsyncSession = Depends(get_db)):
    sites_result = await db.execute(select(Site).order_by(Site.site_name))
    sites = sites_result.scalars().all()
    technicians_result = await db.execute(select(Technician).where(Technician.active == True).order_by(Technician.email))
    technicians = technicians_result.scalars().all()
    access_result = await db.execute(select(TechnicianSiteAccess))
    access_set = {(a.technician_id, a.site_id) for a in access_result.scalars().all()}
    return templates.TemplateResponse('sites.html', {'request': request, 'admin': admin, 'sites': sites, 'technicians': technicians, 'access_set': access_set})


@router.post('/sites/new')
async def new_site(site_id: str = Form(...), site_name: str = Form(...), admin: Technician = Depends(get_admin), db: AsyncSession = Depends(get_db)):
    db.add(Site(site_id=site_id, site_name=site_name))
    await db.commit()
    return RedirectResponse('/admin/sites', status_code=302)


@router.post('/sites/{site_id}/access')
async def update_site_access(site_id: str, request: Request, admin: Technician = Depends(get_admin), db: AsyncSession = Depends(get_db)):
    form = await request.form()
    selected_ids = set(form.getlist('technician_ids'))
    existing = await db.execute(select(TechnicianSiteAccess).where(TechnicianSiteAccess.site_id == site_id))
    for a in existing.scalars().all():
        await db.delete(a)
    await db.flush()
    for tid in selected_ids:
        db.add(TechnicianSiteAccess(technician_id=uuid.UUID(tid), site_id=site_id))
    await db.commit()
    return RedirectResponse('/admin/sites', status_code=302)


@router.get('/technicians', response_class=HTMLResponse)
async def technicians_page(request: Request, admin: Technician = Depends(get_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Technician).order_by(Technician.email))
    technicians = result.scalars().all()
    return templates.TemplateResponse('technicians.html', {'request': request, 'admin': admin, 'technicians': technicians})


@router.post('/technicians/new')
async def new_technician(email: str = Form(...), password: str = Form(...), admin: Technician = Depends(get_admin), db: AsyncSession = Depends(get_db)):
    db.add(Technician(email=email, password_hash=hash_password(password)))
    await db.commit()
    return RedirectResponse('/admin/technicians', status_code=302)


@router.post('/technicians/{technician_id}/toggle')
async def toggle_technician(technician_id: uuid.UUID, admin: Technician = Depends(get_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Technician).where(Technician.id == technician_id))
    technician = result.scalar_one_or_none()
    if technician:
        technician.active = not technician.active
        await db.commit()
    return RedirectResponse('/admin/technicians', status_code=302)


@router.get('/skip-reasons', response_class=HTMLResponse)
async def skip_reasons_page(request: Request, admin: Technician = Depends(get_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SkipReason).order_by(SkipReason.label))
    reasons = result.scalars().all()
    return templates.TemplateResponse('skip_reasons.html', {'request': request, 'admin': admin, 'reasons': reasons})


@router.post('/skip-reasons/new')
async def new_skip_reason(label: str = Form(...), admin: Technician = Depends(get_admin), db: AsyncSession = Depends(get_db)):
    db.add(SkipReason(label=label))
    await db.commit()
    return RedirectResponse('/admin/skip-reasons', status_code=302)


@router.post('/skip-reasons/{reason_id}/toggle')
async def toggle_skip_reason(reason_id: uuid.UUID, admin: Technician = Depends(get_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SkipReason).where(SkipReason.id == reason_id))
    reason = result.scalar_one_or_none()
    if reason:
        reason.active = not reason.active
        await db.commit()
    return RedirectResponse('/admin/skip-reasons', status_code=302)
