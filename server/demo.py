"""Create a complete fictional AssetQ company in a separate demo database.

Demo passwords are deliberately public test credentials, never customer secrets.
The loader adds one company transactionally and never resets an existing tenant.
"""

from __future__ import annotations
import argparse
import base64
import csv
import json
import secrets
import struct
import tempfile
import copy
import zipfile
from xml.sax.saxutils import escape
import sys
import uuid
import zlib
from collections import Counter
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
import app

DEMO_PASSWORD = "AssetQDemo!2026"
WORKSPACE = "evergreen-demo"
COMPANY_NAME = "Evergreen Industries"
VERSION = "assetq-demo-v1"
NAMESPACE = uuid.UUID("2fcb523a-0576-4723-96ef-859320369a31")
CLIENT_ZONE = timezone(timedelta(hours=10))


def ident(kind, code):
    return str(uuid.uuid5(NAMESPACE, f"{WORKSPACE}:{kind}:{code}"))


def floor_image():
    width, height = 480, 320
    scanlines = bytearray()
    for y in range(height):
        scanlines.append(0)
        for x in range(width):
            color = (246, 249, 242)
            for left, top, right, bottom in [
                (20, 20, 295, 175),
                (315, 20, 460, 175),
                (20, 195, 200, 300),
                (220, 195, 460, 300),
            ]:
                if left <= x <= right and top <= y <= bottom:
                    color = (
                        (160, 186, 146)
                        if min(x - left, right - x, y - top, bottom - y) < 5
                        else (235, 243, 225)
                    )
            scanlines.extend(color)

    def chunk(kind, data):
        return (
            struct.pack(">I", len(data))
            + kind
            + data
            + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
        )

    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(bytes(scanlines)))
        + chunk(b"IEND", b"")
    )
    return "data:image/png;base64," + base64.b64encode(png).decode()


def build_fixture(as_of=None):
    anchor = (
        date.fromisoformat(as_of)
        if isinstance(as_of, str)
        else as_of or datetime.now(CLIENT_ZONE).date()
    )
    # Business dates are relative to the day the data is first loaded.
    stamp = (
        datetime.now(timezone.utc).replace(microsecond=0)
        if anchor == datetime.now(CLIENT_ZONE).date()
        else datetime.combine(anchor, datetime.min.time(), timezone.utc).replace(hour=8)
    )
    day = lambda n: (anchor + timedelta(days=n)).isoformat()
    moment = lambda hours: (stamp + timedelta(hours=hours)).isoformat()
    fixture = {
        "schema_version": 1,
        "demo_only": True,
        "as_of": anchor.isoformat(),
        "company": {
            "id": ident("tenant", WORKSPACE),
            "code": WORKSPACE,
            "name": COMPANY_NAME,
            "industry": "Manufacturing and corporate services",
            "settings": {
                "timezone": "Asia/Kolkata",
                "currency": "INR",
                "edition": "Professional",
                "reviewed": True,
                "live": True,
                "demo_data_version": VERSION,
            },
        },
        "roles": [],
        "users": [],
        "collections": {k: [] for k in app.COLLECTIONS},
    }
    roles = [
        ("ADMIN", "Administrator", app.PERMISSIONS),
        (
            "ASSET",
            "Asset manager",
            ["assets", "maintenance", "masters", "finance", "approvals", "audit"],
        ),
        ("HELPDESK", "Helpdesk agent", ["tickets", "maintenance", "assets"]),
        ("EMPLOYEE", "Employee", []),
        ("AUDITOR", "Auditor", ["audit"]),
        ("FINANCE", "Finance analyst", ["finance", "approvals", "audit"]),
        ("TECHNICIAN", "Maintenance technician", ["maintenance", "assets"]),
    ]
    for code, name, permissions in roles:
        fixture["roles"].append(
            {"code": code, "name": name, "permissions": permissions}
        )
    people = [
        ("admin", "Arjun Mehta", "ADMIN", "ADMIN", "HQ"),
        ("admin.backup", "Kavya Rao", "ADMIN", "IT", "HQ"),
        ("asset.manager", "Priya Sharma", "ASSET", "ADMIN", "HQ"),
        ("asset.manager.plant", "Rohan Iyer", "ASSET", "OPERATIONS", "BLR"),
        ("helpdesk", "Neha Kapoor", "HELPDESK", "IT", "HQ"),
        ("helpdesk.network", "Vikram Joshi", "HELPDESK", "IT", "HQ"),
        ("helpdesk.plant", "Aisha Khan", "HELPDESK", "IT", "BLR"),
        ("helpdesk.warehouse", "Rahul Das", "HELPDESK", "IT", "PUN"),
        ("technician", "Sanjay Verma", "TECHNICIAN", "MAINTENANCE", "BLR"),
        ("technician.hvac", "Divya Menon", "TECHNICIAN", "MAINTENANCE", "HQ"),
        ("technician.fleet", "Amit Singh", "TECHNICIAN", "MAINTENANCE", "PUN"),
        ("finance", "Meera Nair", "FINANCE", "FINANCE", "HQ"),
        ("finance.controller", "Dev Patel", "FINANCE", "FINANCE", "HQ"),
        ("auditor", "Ishita Bose", "AUDITOR", "QUALITY", "HQ"),
        ("auditor.plant", "Nitin Gupta", "AUDITOR", "QUALITY", "BLR"),
        ("employee", "Ananya Reddy", "EMPLOYEE", "HR", "HQ"),
        ("employee.operations", "Kiran Kumar", "EMPLOYEE", "OPERATIONS", "BLR"),
        ("employee.warehouse", "Pooja Sethi", "EMPLOYEE", "WAREHOUSE", "PUN"),
        ("employee.quality", "Aditya Sen", "EMPLOYEE", "QUALITY", "BLR"),
        ("employee.admin", "Sneha Pillai", "EMPLOYEE", "ADMIN", "HQ"),
        ("employee.hr", "Varun Malhotra", "EMPLOYEE", "HR", "HQ"),
        ("employee.planning", "Tara Desai", "EMPLOYEE", "OPERATIONS", "HQ"),
        ("employee.production", "Manoj Bhat", "EMPLOYEE", "OPERATIONS", "BLR"),
        ("employee.dispatch", "Ritika Jain", "EMPLOYEE", "WAREHOUSE", "PUN"),
        ("employee.safety", "Suresh Roy", "EMPLOYEE", "QUALITY", "BLR"),
        ("employee.accounts", "Leena Thomas", "EMPLOYEE", "FINANCE", "HQ"),
        ("employee.facilities", "Harish Rao", "EMPLOYEE", "ADMIN", "HQ"),
        ("employee.inventory", "Nisha Shah", "EMPLOYEE", "WAREHOUSE", "PUN"),
        ("employee.supervisor", "Deepak Sinha", "EMPLOYEE", "OPERATIONS", "BLR"),
        ("employee.reception", "Riya Verma", "EMPLOYEE", "ADMIN", "HQ"),
    ]
    for local, name, role, department, site in people:
        email = f"{local}@evergreen.example.test"
        fixture["users"].append(
            {
                "id": ident("user", email),
                "name": name,
                "email": email,
                "role_code": role,
                "department_code": department,
                "site_code": site,
                "status": "ACTIVE",
                "initial_password": DEMO_PASSWORD,
            }
        )
    users = {u["email"].split("@")[0]: u for u in fixture["users"]}

    def add(kind, code, name, **fields):
        record = {
            "created_at": moment(-24),
            "updated_at": moment(-1),
            "id": ident(kind, code),
            "code": code,
            "name": name,
            "status": "ACTIVE",
            **fields,
        }
        fixture["collections"][kind].append(record)
        return record

    locations = [
        ("HQ", "Hyderabad headquarters", "SITE", None),
        ("HQ-ADMIN", "Headquarters administration block", "BUILDING", "HQ"),
        ("HQ-F1", "Headquarters first floor", "FLOOR", "HQ-ADMIN"),
        ("HQ-IT", "IT workspace", "ROOM", "HQ-F1"),
        ("HQ-OPS", "Operations office", "ROOM", "HQ-F1"),
        ("HQ-FIN", "Finance office", "ROOM", "HQ-F1"),
        ("HQ-STORE", "Headquarters asset store", "STORE", "HQ-F1"),
        ("HQ-SERVER", "Server room", "ROOM", "HQ-F1"),
        ("HQ-MEET", "Conference room", "ROOM", "HQ-F1"),
        ("HQ-F2", "Headquarters second floor", "FLOOR", "HQ-ADMIN"),
        ("HQ-HR", "People operations", "ROOM", "HQ-F2"),
        ("HQ-COMMON", "Shared facilities", "ROOM", "HQ-F2"),
        ("BLR", "Bengaluru production plant", "SITE", None),
        ("BLR-WORKS", "Production building", "BUILDING", "BLR"),
        ("BLR-GF", "Plant ground floor", "FLOOR", "BLR-WORKS"),
        ("BLR-LINE1", "Production line one", "ROOM", "BLR-GF"),
        ("BLR-LINE2", "Production line two", "ROOM", "BLR-GF"),
        ("BLR-UTIL", "Utilities room", "ROOM", "BLR-GF"),
        ("BLR-STORE", "Plant asset store", "STORE", "BLR-GF"),
        ("BLR-OFFICE", "Plant office", "ROOM", "BLR-GF"),
        ("PUN", "Pune distribution center", "SITE", None),
        ("PUN-WH", "Warehouse building", "BUILDING", "PUN"),
        ("PUN-GF", "Warehouse ground floor", "FLOOR", "PUN-WH"),
        ("PUN-STORAGE", "Storage area", "ROOM", "PUN-GF"),
        ("PUN-DISPATCH", "Dispatch office", "ROOM", "PUN-GF"),
        ("PUN-STORE", "Warehouse asset store", "STORE", "PUN-GF"),
    ]
    for code, name, kind, parent in locations:
        add("locations", code, name, type=kind, parent_location_code=parent or "")
    departments = [
        ("IT", "Information technology", "helpdesk"),
        ("OPERATIONS", "Operations", "asset.manager.plant"),
        ("FINANCE", "Finance and accounts", "finance.controller"),
        ("HR", "People operations", "admin"),
        ("ADMIN", "Administration", "asset.manager"),
        ("MAINTENANCE", "Engineering and maintenance", "technician"),
        ("WAREHOUSE", "Warehousing and logistics", "asset.manager.plant"),
        ("QUALITY", "Quality and compliance", "auditor"),
    ]
    for n, (code, name, approver) in enumerate(departments, 1):
        add(
            "departments",
            code,
            name,
            cost_center=f"CC-{n:03}",
            approver_id=users[approver]["id"],
        )
    deps = [
        ("DEP-IT", "IT equipment · straight line", "SLM", 36, 10),
        ("DEP-EQP", "Plant equipment · straight line", "SLM", 120, 10),
        ("DEP-VEH", "Vehicles · declining balance", "WDV", 60, 20),
        ("DEP-FURN", "Furniture · straight line", "SLM", 84, 10),
        ("DEP-NET", "Network and servers · straight line", "SLM", 60, 10),
        ("DEP-HVAC", "HVAC equipment · straight line", "SLM", 96, 10),
    ]
    for n, (code, name, method, life, residual) in enumerate(deps, 1):
        add(
            "depreciation",
            code,
            name,
            method=method,
            life_months=life,
            residual_percent=residual,
            gl_asset_account=f"150{n}",
            gl_dep_account=f"650{n}",
        )
    cats = [
        ("CAT-LAP", "Laptops", "IT", "DEP-IT"),
        ("CAT-DESK", "Desktop computers", "IT", "DEP-IT"),
        ("CAT-MON", "Monitors", "IT", "DEP-IT"),
        ("CAT-PRINT", "Printers", "IT", "DEP-IT"),
        ("CAT-NET", "Network equipment", "IT", "DEP-NET"),
        ("CAT-SRV", "Servers", "IT", "DEP-NET"),
        ("CAT-PHONE", "Mobile devices", "IT", "DEP-IT"),
        ("CAT-GEN", "Generators", "NON_IT", "DEP-EQP"),
        ("CAT-HVAC", "HVAC systems", "NON_IT", "DEP-HVAC"),
        ("CAT-VEH", "Vehicles", "NON_IT", "DEP-VEH"),
        ("CAT-FURN", "Furniture", "NON_IT", "DEP-FURN"),
        ("CAT-SAFE", "Safety equipment", "NON_IT", "DEP-EQP"),
    ]
    for code, name, domain, dep in cats:
        add(
            "categories",
            code,
            name,
            domain=domain,
            depreciation_code=dep,
            sla_code="SLA-P2" if code in ["CAT-SRV", "CAT-GEN"] else "SLA-P3",
        )
    models = [
        ("MOD-LAP-01", "Latitude 5450", "Dell", "CAT-LAP", 36),
        ("MOD-LAP-02", "ThinkPad T14", "Lenovo", "CAT-LAP", 36),
        ("MOD-DESK-01", "OptiPlex 7020", "Dell", "CAT-DESK", 36),
        ("MOD-DESK-02", "ThinkCentre M70", "Lenovo", "CAT-DESK", 36),
        ("MOD-MON-01", "P2425H display", "Dell", "CAT-MON", 36),
        ("MOD-PRINT-01", "LaserJet Pro M404", "HP", "CAT-PRINT", 24),
        ("MOD-NET-01", "Catalyst access switch", "Cisco", "CAT-NET", 36),
        ("MOD-NET-02", "Aruba access point", "HPE", "CAT-NET", 36),
        ("MOD-SRV-01", "PowerEdge R350", "Dell", "CAT-SRV", 60),
        ("MOD-PHONE-01", "Galaxy A55", "Samsung", "CAT-PHONE", 24),
        ("MOD-GEN-01", "62.5 kVA standby set", "Demo Power Systems", "CAT-GEN", 24),
        ("MOD-GEN-02", "125 kVA standby set", "Demo Power Systems", "CAT-GEN", 24),
        (
            "MOD-HVAC-01",
            "2 ton split air conditioner",
            "Demo Climate Systems",
            "CAT-HVAC",
            24,
        ),
        (
            "MOD-HVAC-02",
            "Packaged air handling unit",
            "Demo Climate Systems",
            "CAT-HVAC",
            36,
        ),
        ("MOD-VEH-01", "Utility delivery van", "Demo Fleet Motors", "CAT-VEH", 36),
        (
            "MOD-FURN-01",
            "Ergonomic workstation",
            "Demo Workspace Furnishings",
            "CAT-FURN",
            12,
        ),
        (
            "MOD-FURN-02",
            "Storage cabinet",
            "Demo Workspace Furnishings",
            "CAT-FURN",
            12,
        ),
        ("MOD-SAFE-01", "ABC fire extinguisher", "Demo Safety Systems", "CAT-SAFE", 12),
    ]
    for code, name, manufacturer, cat, months in models:
        add(
            "models",
            code,
            name,
            manufacturer=manufacturer,
            category_code=cat,
            warranty_months=months,
        )
    vendors = [
        ("VEN-IT", "GreenCircuit IT Services", "SERVICE"),
        ("VEN-NET", "Northline Network Support", "SERVICE"),
        ("VEN-POWER", "Everbright Power Services", "OEM"),
        ("VEN-HVAC", "BreezeWorks Facilities", "SERVICE"),
        ("VEN-FLEET", "TransitCare Fleet Services", "SERVICE"),
        ("VEN-SAFE", "SafeSite Compliance Services", "SERVICE"),
    ]
    for n, (code, name, kind) in enumerate(vendors, 1):
        add(
            "vendors",
            code,
            name,
            type=kind,
            email=f"service{n}@vendor.example.test",
            phone=f"DEMO-CONTACT-{n:03}",
            tax_id=f"DEMO-TAX-{n:03}",
        )
    contract_specs = [
        ("AMC-IT", "IT hardware support", "VEN-IT", "AMC", 320),
        ("AMC-NET", "Network annual maintenance", "VEN-NET", "AMC", 25),
        ("AMC-POWER", "Generator support", "VEN-POWER", "AMC", 120),
        ("AMC-HVAC", "HVAC maintenance", "VEN-HVAC", "AMC", 15),
        ("AMC-FLEET", "Fleet service agreement", "VEN-FLEET", "AMC", 210),
        ("AMC-SAFETY", "Safety inspection services", "VEN-SAFE", "AMC", 60),
        ("WAR-SERVER", "Server extended warranty", "VEN-IT", "WARRANTY", 450),
        ("AMC-HVAC-OLD", "Previous HVAC service agreement", "VEN-HVAC", "AMC", -15),
    ]
    for code, name, vendor, kind, end in contract_specs:
        add(
            "contracts",
            code,
            name,
            vendor_code=vendor,
            type=kind,
            start_date=day(-365),
            end_date=day(end),
            sla_code="SLA-P2",
            status="EXPIRED" if end < 0 else "ACTIVE",
        )
    for code, name, rate in [
        ("TAX-18", "Demo GST 18%", 18),
        ("TAX-5", "Demo GST 5%", 5),
        ("TAX-0", "Demo tax exempt", 0),
    ]:
        add("taxes", code, name, rate=rate, gl_tax_account="2100")
    for priority, response, resolution in [
        ("P1", 15, 240),
        ("P2", 30, 480),
        ("P3", 120, 1440),
        ("P4", 240, 2880),
        ("P5", 480, 4320),
    ]:
        add(
            "sla",
            "SLA-" + priority,
            f"{priority} support · 24/7",
            priority=priority,
            response_minutes=response,
            resolution_minutes=resolution,
            calendar="24x7",
        )
    services = [
        ("SVC-IT", "IT support", "INCIDENT", "IT support"),
        ("SVC-FAC", "Facilities support", "WORK_ORDER", "Facilities"),
        ("SVC-ACCESS", "Application access", "REQUEST", "IT support"),
        ("SVC-DEVICE", "Device setup", "REQUEST", "IT support"),
        ("SVC-RETURN", "Asset return", "REQUEST", "IT support"),
        ("SVC-PM", "Preventive maintenance", "WORK_ORDER", "Facilities"),
    ]
    for code, name, kind, group in services:
        add("services", code, name, type=kind, group=group, sla_code="SLA-P3")
    checklists = [
        (
            "CHK-IT",
            "IT health check",
            [
                "Inspect device condition",
                "Confirm patch and antivirus status",
                "Verify backup and connectivity",
                "Record findings",
            ],
        ),
        (
            "CHK-NET",
            "Network inspection",
            [
                "Inspect cabling and power",
                "Check link status and firmware",
                "Record utilization and errors",
                "Confirm redundancy",
            ],
        ),
        (
            "CHK-GEN",
            "Generator service",
            [
                "Verify safe isolation",
                "Inspect fluids and connections",
                "Run authorized load test",
                "Record run hours and findings",
            ],
        ),
        (
            "CHK-HVAC",
            "HVAC service",
            [
                "Isolate equipment safely",
                "Clean filters and inspect coils",
                "Check drainage and operating readings",
                "Restore service and record findings",
            ],
        ),
        (
            "CHK-FLEET",
            "Fleet inspection",
            [
                "Inspect tires brakes and lights",
                "Record odometer and fluid readings",
                "Verify documents and safety kit",
                "Record service findings",
            ],
        ),
        (
            "CHK-SAFE",
            "Safety equipment inspection",
            [
                "Verify tag and access",
                "Inspect seal and pressure indicator",
                "Check inspection dates",
                "Record condition and corrective action",
            ],
        ),
    ]
    for code, name, steps in checklists:
        add("checklists", code, name, steps="\n".join(steps))
    knowledge = [
        (
            "KB-001",
            "Troubleshoot network connectivity",
            "Network",
            "Check the cable or Wi-Fi connection. Restart the network adapter. Confirm whether other devices are affected. Record the error and escalate to IT support if connectivity is not restored.",
        ),
        (
            "KB-002",
            "Device will not power on",
            "Hardware",
            "Check the approved power adapter and socket. Disconnect peripherals and retry. Do not open equipment under warranty; contact the authorized service provider.",
        ),
        (
            "KB-003",
            "Preventive maintenance essentials",
            "Facilities",
            "Use the approved checklist, isolate equipment safely, record readings, and document issues before closing the work order.",
        ),
        (
            "KB-004",
            "Printer paper jams",
            "Hardware",
            "Pause printing. Follow the manufacturer guide to remove paper safely. Inspect paper size and tray settings; record any repeated error.",
        ),
        (
            "KB-005",
            "Request application access",
            "Software",
            "Raise a service request with application and business justification. Obtain the designated approver’s authorization before provisioning access.",
        ),
        (
            "KB-006",
            "Password and account support",
            "Software",
            "Use the account password-change feature. Never share passwords in a ticket. Contact the administrator if the account is blocked.",
        ),
        (
            "KB-007",
            "HVAC low cooling checks",
            "Facilities",
            "Confirm permitted thermostat settings and inspect filter condition. A trained technician must perform electrical or refrigerant checks.",
        ),
        (
            "KB-008",
            "Generator recurring alarms",
            "Facilities",
            "Record the alarm code and conditions. Follow site safety procedures and notify the authorized maintenance team. Do not bypass safety interlocks.",
        ),
        (
            "KB-009",
            "Returning an assigned asset",
            "Hardware",
            "Raise an asset return request, record serial and condition, and arrange a documented handover with the asset manager.",
        ),
        (
            "KB-010",
            "Asset retirement and disposal",
            "Facilities",
            "Document the end-of-life reason and obtain approval from another authorized reviewer. Confirm data sanitization and finance closure before disposal.",
        ),
    ]
    for code, name, cat, body in knowledge:
        add("knowledge", code, name, category=cat, body=body)
    repair = {3, 41, 49, 64, 67}
    maintenance = {55, 65, 68, 73}
    stock = {8, 12, 23, 28, 33, 36, 44, 50, 53, 57, 60, 63, 66, 74, 76}
    draft = {70, 78}
    retired = {19, 77}
    active = {56, 71}
    asset_groups = [
        ("CAT-LAP", 25, 75000, ["MOD-LAP-01", "MOD-LAP-02"], "VEN-IT"),
        ("CAT-DESK", 8, 55000, ["MOD-DESK-01", "MOD-DESK-02"], "VEN-IT"),
        ("CAT-MON", 12, 14000, ["MOD-MON-01"], "VEN-IT"),
        ("CAT-PRINT", 5, 35000, ["MOD-PRINT-01"], "VEN-IT"),
        ("CAT-NET", 5, 22000, ["MOD-NET-01", "MOD-NET-02"], "VEN-NET"),
        ("CAT-SRV", 3, 250000, ["MOD-SRV-01"], "VEN-IT"),
        ("CAT-PHONE", 5, 24000, ["MOD-PHONE-01"], "VEN-IT"),
        ("CAT-GEN", 3, 480000, ["MOD-GEN-01", "MOD-GEN-02"], "VEN-POWER"),
        ("CAT-HVAC", 5, 62000, ["MOD-HVAC-01", "MOD-HVAC-02"], "VEN-HVAC"),
        ("CAT-VEH", 3, 950000, ["MOD-VEH-01"], "VEN-FLEET"),
        ("CAT-FURN", 4, 10000, ["MOD-FURN-01", "MOD-FURN-02"], "VEN-IT"),
        ("CAT-SAFE", 2, 5000, ["MOD-SAFE-01"], "VEN-SAFE"),
    ]
    categories = {c["code"]: c for c in fixture["collections"]["categories"]}
    model_map = {m["code"]: m for m in fixture["collections"]["models"]}
    index = 0
    for category, count, cost, model_codes, vendor in asset_groups:
        for n in range(count):
            index += 1
            owner = fixture["users"][(index - 1) % len(people)]
            model = model_map[model_codes[n % len(model_codes)]]
            cat = categories[category]
            status = (
                "IN_REPAIR"
                if index in repair
                else (
                    "MAINTENANCE"
                    if index in maintenance
                    else (
                        "IN_STOCK"
                        if index in stock
                        else (
                            "DRAFT"
                            if index in draft
                            else (
                                "RETIRED"
                                if index in retired
                                else (
                                    "ACTIVE"
                                    if index in active
                                    else (
                                        "DISPOSED"
                                        if index == 79
                                        else "ARCHIVED" if index == 80 else "ASSIGNED"
                                    )
                                )
                            )
                        )
                    )
                )
            )
            if index == 22:
                status = "TRANSFERRED"
            location = (
                {"HQ": "HQ-IT", "BLR": "BLR-OFFICE", "PUN": "PUN-DISPATCH"}[
                    owner["site_code"]
                ]
                if cat["domain"] == "IT"
                else ["BLR-LINE1", "BLR-UTIL", "HQ-COMMON", "PUN-STORAGE"][n % 4]
            )
            if category == "CAT-SRV":
                location = "HQ-SERVER"
            if status == "IN_STOCK":
                location = {"HQ": "HQ-STORE", "BLR": "BLR-STORE", "PUN": "PUN-STORE"}[
                    owner["site_code"]
                ]
            warranty_delta = [-90, 5, 12, 25, 45, 120, 365, 730][index % 8]
            a = add(
                "assets",
                f"AST-{index:04}",
                f"{model['name']} · {n+1:02}",
                category_code=category,
                model_code=model["code"],
                serial_number=f"DEMO-SN-{index:05}",
                location_code=location,
                department_code=owner["department_code"],
                assigned_user_id=(
                    owner["id"]
                    if status in ["ASSIGNED", "IN_REPAIR", "MAINTENANCE"]
                    else ""
                ),
                vendor_code=vendor,
                status=status,
                warranty_end=day(warranty_delta),
                cost=cost + (n % 3) * 1000,
                activation_date=day(-180 - (index % 12) * 90),
                depreciation_code=cat["depreciation_code"],
                description=f"Fictional demo asset for {COMPANY_NAME}. IT and non-IT lifecycle illustration; no purchase order or procurement data.",
                verified_at=moment(-72 - index) if index % 4 else "",
                verified_by=users["asset.manager"]["id"] if index % 4 else "",
            )
            a["created_at"] = a["activation_date"] + "T08:00:00+00:00"
            if status == "DRAFT":
                a["activation_date"] = ""
                a["created_at"] = moment(-24)
            if status == "TRANSFERRED":
                a["previous_location_code"] = a["location_code"]
                a["location_code"] = "BLR-OFFICE"
                a["transfer_destination"] = "BLR-OFFICE"
                a["assigned_user_id"] = owner["id"]
            if category in ["CAT-GEN", "CAT-HVAC", "CAT-VEH", "CAT-NET", "CAT-SRV"]:
                a.update(
                    next_due=day(10 + index % 25),
                    frequency_days=90 if cat["domain"] == "IT" else 30,
                )
            if category == "CAT-VEH":
                a["description"] += " Demo registration: DEMO-FLEET-" + str(n + 1)
    assets = {a["code"]: a for a in fixture["collections"]["assets"]}
    ticket_states = (
        ["NEW"] * 6
        + ["IN_PROGRESS"] * 8
        + ["ASSIGNED"] * 4
        + ["PENDING_USER"] * 4
        + ["PENDING_VENDOR"] * 4
        + ["RESOLVED"] * 4
        + ["CLOSED"] * 4
        + ["REOPENED"] * 2
    )
    issues = [
        (
            "Laptop cannot boot",
            "Hardware",
            "Check approved power source; route to IT support.",
            3,
        ),
        (
            "Laptop Wi-Fi disconnects repeatedly",
            "Network",
            "Connection drops during meetings; inspect network adapter logs.",
            3,
        ),
        (
            "Laptop power failure recurred",
            "Hardware",
            "A previous incident returned; review hardware history.",
            3,
        ),
        (
            "Printer paper jam",
            "Hardware",
            "The paper tray repeatedly jams during dispatch printing.",
            49,
        ),
        (
            "Generator alarm during load test",
            "Facilities",
            "An alarm was recorded during a supervised generator test.",
            64,
        ),
        (
            "Air conditioning not cooling",
            "Facilities",
            "Cooling is below the approved set point; inspect filters.",
            67,
        ),
        (
            "Monitor display flickers",
            "Hardware",
            "Display flickers while using the approved cable.",
            41,
        ),
        (
            "Network switch intermittent link",
            "Network",
            "The plant link briefly drops and reconnects.",
            55,
        ),
        (
            "Application access request",
            "Software",
            "Request access for an approved business activity.",
            16,
        ),
        (
            "Device setup request",
            "Software",
            "Configure the assigned workstation and approved applications.",
            17,
        ),
        (
            "Fleet service inspection",
            "Facilities",
            "Inspect the delivery vehicle using the fleet checklist.",
            73,
        ),
        (
            "Server backup warning",
            "Software",
            "Review the backup job error and confirm the restore-point status.",
            56,
        ),
    ]
    agents = [
        users[k]
        for k in [
            "helpdesk",
            "helpdesk.network",
            "helpdesk.plant",
            "helpdesk.warehouse",
        ]
    ]
    for n, state in enumerate(ticket_states, 1):
        title, category, description, number = issues[(n - 1) % len(issues)]
        asset = assets[f"AST-{number:04}"]
        requester = next(
            (u for u in fixture["users"] if u["id"] == asset.get("assigned_user_id")),
            fixture["users"][15 + (n % 15)],
        )
        priority = (
            "P1"
            if n in [5, 8]
            else (
                "P2"
                if n % 4 == 0
                else "P4" if n % 6 == 0 else "P5" if n % 11 == 0 else "P3"
            )
        )
        resolution = {"P1": 240, "P2": 480, "P3": 1440, "P4": 2880, "P5": 4320}[
            priority
        ]
        opened = stamp - timedelta(hours=6 + (n % 5) * 6)
        due = opened + timedelta(minutes=resolution)
        if state in ["NEW", "ASSIGNED"] and n % 2:
            opened = stamp - timedelta(minutes=30)
            due = opened + timedelta(minutes=resolution)
        if state in ["RESOLVED", "CLOSED"]:
            opened = stamp - timedelta(minutes=resolution + 120)
            due = opened + timedelta(minutes=resolution)
        if n == 2:
            opened = stamp - timedelta(minutes=resolution * 0.85)
            due = opened + timedelta(minutes=resolution)
        comments = [
            {
                "author": requester["name"],
                "body": "Demo request: " + description,
                "at": opened.isoformat(),
            }
        ]
        if state != "NEW":
            comments.append(
                {
                    "author": agents[n % 4]["name"],
                    "body": "Acknowledged and reviewing asset history and the relevant knowledge article.",
                    "at": (opened + timedelta(minutes=20)).isoformat(),
                }
            )
        t = add(
            "tickets",
            f"TKT-{n:04}",
            title + f" · case {n:02}",
            description=description + " This is fictional sample content.",
            type=(
                "REQUEST"
                if "request" in title.lower()
                else "WORK_ORDER" if category == "Facilities" else "INCIDENT"
            ),
            category=category,
            priority=priority,
            group="Facilities" if category == "Facilities" else "IT support",
            asset_id=asset["id"],
            requester_id=requester["id"],
            assigned_user_id="" if state == "NEW" else agents[n % 4]["id"],
            status=state,
            opened_at=opened.isoformat(),
            due_at=due.isoformat(),
            comments=comments,
        )
        t["created_at"] = opened.isoformat()
        t["updated_at"] = (stamp - timedelta(minutes=10)).isoformat()
        if state in ["RESOLVED", "CLOSED"]:
            t["resolved_at"] = (
                due - timedelta(minutes=30) if n % 3 else due + timedelta(minutes=45)
            ).isoformat()
            t["comments"].append(
                {
                    "author": agents[n % 4]["name"],
                    "body": "Demo resolution: approved troubleshooting completed and service restored.",
                    "at": t["resolved_at"],
                }
            )
    work_assets = [
        3,
        49,
        64,
        65,
        67,
        68,
        73,
        55,
        65,
        68,
        73,
        55,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
    ]
    checklist_map = {c["code"]: c for c in fixture["collections"]["checklists"]}
    for n, number in enumerate(work_assets, 1):
        asset = assets[f"AST-{number:04}"]
        cat = asset["category_code"]
        check_code = (
            "CHK-GEN"
            if cat == "CAT-GEN"
            else (
                "CHK-HVAC"
                if cat == "CAT-HVAC"
                else (
                    "CHK-FLEET"
                    if cat == "CAT-VEH"
                    else "CHK-NET" if cat in ["CAT-NET", "CAT-SRV"] else "CHK-IT"
                )
            )
        )
        check = checklist_map[check_code]
        state = "COMPLETED" if n <= 8 else "IN_PROGRESS" if n <= 12 else "SCHEDULED"
        scheduled = (
            day(-30 - n)
            if state == "COMPLETED"
            else (
                day(-3)
                if state == "IN_PROGRESS"
                else day([-4, -2, 0, 1, 3, 5, 10, 14][n - 13])
            )
        )
        interval = 30 if cat in ["CAT-GEN", "CAT-HVAC", "CAT-VEH"] else 90
        w = add(
            "maintenance",
            f"WO-{n:04}",
            f"{check['name']} · {asset['code']}",
            asset_id=asset["id"],
            scheduled_date=scheduled,
            frequency_days=interval,
            group=(
                "Facilities"
                if cat in ["CAT-GEN", "CAT-HVAC", "CAT-VEH"]
                else "IT support"
            ),
            assigned_user_id=(
                users["technician"]["id"]
                if cat == "CAT-GEN"
                else (
                    users["technician.hvac"]["id"]
                    if cat == "CAT-HVAC"
                    else (
                        users["technician.fleet"]["id"]
                        if cat == "CAT-VEH"
                        else users["helpdesk"]["id"]
                    )
                )
            ),
            checklist=check["steps"],
            status=state,
        )
        if state == "COMPLETED":
            w["created_at"] = (
                datetime.fromisoformat(scheduled).replace(tzinfo=timezone.utc)
                - timedelta(days=7)
            ).isoformat()
            w.update(
                completed_at=(
                    datetime.fromisoformat(scheduled).replace(tzinfo=timezone.utc)
                    + timedelta(days=1, hours=16)
                ).isoformat(),
                notes="Demo maintenance completed. All checklist steps passed; no unsafe bypasses performed.",
                completed_steps=check["steps"].split("\n"),
            )
            w["updated_at"] = w["completed_at"]
        else:
            asset.update(next_due=scheduled, frequency_days=interval)
            w["dedupe"] = f"pm:{asset['id']}:{scheduled}"
    requests = [
        (
            "APP-001",
            "TRANSFERRED",
            5,
            "PENDING",
            "Move the approved workstation to the plant office.",
            "BLR-OFFICE",
        ),
        (
            "APP-002",
            "RETIRED",
            12,
            "PENDING",
            "End-of-life review after repeated issues.",
            "",
        ),
        (
            "APP-003",
            "DISPOSED",
            77,
            "PENDING",
            "Retired furniture requires an approved disposal method.",
            "",
        ),
        (
            "APP-004",
            "RETIRED",
            19,
            "APPROVED",
            "Demo retirement after condition assessment.",
            "",
        ),
        (
            "APP-005",
            "DISPOSED",
            79,
            "APPROVED",
            "Demo disposal after safety-equipment decommissioning.",
            "",
        ),
        (
            "APP-006",
            "RETIRED",
            20,
            "REJECTED",
            "Replacement request rejected; the asset is still serviceable.",
            "",
        ),
    ]
    requests.append(
        (
            "APP-007",
            "TRANSFERRED",
            22,
            "APPROVED",
            "Approved demonstration transfer; handover confirmation is pending.",
            "BLR-OFFICE",
        )
    )
    for code, action, number, status, reason, destination in requests:
        asset = assets[f"AST-{number:04}"]
        r = add(
            "approvals",
            code,
            f'{action.title()} · {asset["name"]}',
            asset_id=asset["id"],
            action=action,
            reason=reason,
            location_code=destination,
            requested_by=users["asset.manager"]["id"],
            status=status,
        )
        if status != "PENDING":
            r["created_at"] = moment(-72)
            r.update(
                reviewed_by=(
                    users["finance"]["id"]
                    if action == "DISPOSED"
                    else users["asset.manager.plant"]["id"]
                ),
                reviewed_at=moment(-48),
            )
    for n, location in enumerate(["HQ-IT", "BLR-LINE1", "PUN-DISPATCH"], 1):
        placed = [
            a
            for a in fixture["collections"]["assets"]
            if a["location_code"] == location
            and a["status"] not in ["ARCHIVED", "DISPOSED"]
        ]
        add(
            "layouts",
            f"PLAN-{n:02}",
            {
                "HQ-IT": "Headquarters IT floor",
                "BLR-LINE1": "Production line floor",
                "PUN-DISPATCH": "Warehouse dispatch floor",
            }[location],
            location_code=location,
            image=floor_image(),
            mappings=[
                {"asset_id": a["id"], "x": 15 + (i % 4) * 22, "y": 22 + (i // 4) * 20}
                for i, a in enumerate(placed[:12])
            ],
        )
    return fixture


def validate_fixture(fixture):
    collections = fixture["collections"]
    users = {u["id"]: u for u in fixture["users"]}
    roles = {r["code"] for r in fixture["roles"]}
    assets = {a["id"]: a for a in collections["assets"]}
    locations = {l["code"]: l for l in collections["locations"]}
    if set(roles) != {u["role_code"] for u in fixture["users"]}:
        raise ValueError("Every role must have at least one demo user")
    references = {
        "location_code": "locations",
        "parent_location_code": "locations",
        "category_code": "categories",
        "model_code": "models",
        "vendor_code": "vendors",
        "department_code": "departments",
        "depreciation_code": "depreciation",
        "sla_code": "sla",
    }
    codes = {kind: {r["code"] for r in rows} for kind, rows in collections.items()}
    for kind, rows in collections.items():
        if len(codes[kind]) != len(rows):
            raise ValueError("Duplicate " + kind + " code")
        for r in rows:
            if not r.get("name"):
                raise ValueError("Record needs a name")
            for key, target in references.items():
                if r.get(key) and r[key] not in codes[target]:
                    raise ValueError(f"Broken {kind}.{key}: {r[key]}")
            for key in [
                "assigned_user_id",
                "requester_id",
                "requested_by",
                "reviewed_by",
                "verified_by",
                "approver_id",
            ]:
                if r.get(key) and r[key] not in users:
                    raise ValueError("Broken user reference " + key)
            if r.get("asset_id") and r["asset_id"] not in assets:
                raise ValueError("Broken asset reference")
            if kind == "assets":
                if r["status"] not in app.STATE:
                    raise ValueError("Invalid asset state")
                if r["status"] == "ASSIGNED" and not r.get("assigned_user_id"):
                    raise ValueError("Assigned asset has no owner")
                model = next(
                    m for m in collections["models"] if m["code"] == r["model_code"]
                )
                if model["category_code"] != r["category_code"]:
                    raise ValueError("Asset/model category mismatch")
            if kind == "approvals":
                if r.get("reviewed_by") == r["requested_by"]:
                    raise ValueError("Self approval in fixture")
                if (
                    r["status"] == "PENDING"
                    and r["action"] not in app.STATE[assets[r["asset_id"]]["status"]]
                ):
                    raise ValueError("Invalid pending approval transition")
            if kind == "layouts":
                for mapping in r["mappings"]:
                    if (
                        assets[mapping["asset_id"]]["location_code"]
                        != r["location_code"]
                    ):
                        raise ValueError(
                            "Layout contains an asset from another location"
                        )
                    if not (0 <= mapping["x"] <= 100 and 0 <= mapping["y"] <= 100):
                        raise ValueError("Map coordinates outside image")
            if kind == "maintenance" and r["status"] == "COMPLETED":
                if set(r["checklist"].split("\n")) != set(r["completed_steps"]):
                    raise ValueError("Completed work has incomplete checklist")
    return True


def summary(c, tenant_id):
    counts = {
        kind: c.execute(
            "SELECT COUNT(*) FROM records WHERE tenant_id=? AND kind=?",
            (tenant_id, kind),
        ).fetchone()[0]
        for kind in app.COLLECTIONS
    }
    counts.update(
        users=c.execute(
            "SELECT COUNT(*) FROM users WHERE tenant_id=?", (tenant_id,)
        ).fetchone()[0],
        roles=c.execute(
            "SELECT COUNT(*) FROM roles WHERE tenant_id=?", (tenant_id,)
        ).fetchone()[0],
        audit=c.execute(
            "SELECT COUNT(*) FROM audit WHERE tenant_id=?", (tenant_id,)
        ).fetchone()[0],
    )
    return counts


def load_demo(database=None, as_of=None):
    fixture = build_fixture(as_of)
    validate_fixture(fixture)
    company = fixture["company"]
    t = company["id"]
    previous = app.DB
    app.DB = str(Path(database or app.ROOT / ".data/assetq-demo.sqlite3").resolve())
    try:
        app.init()
        with app.connect() as c:
            c.execute("BEGIN IMMEDIATE")
            existing = c.execute(
                "SELECT * FROM tenants WHERE code=? OR id=?", (WORKSPACE, t)
            ).fetchone()
            if existing:
                if (
                    existing["id"] != t
                    or existing["code"] != WORKSPACE
                    or json.loads(existing["settings"]).get("demo_data_version")
                    != VERSION
                ):
                    raise ValueError(
                        "Workspace code is already used by another company. Nothing was replaced."
                    )
                return {
                    "created": False,
                    "workspace": WORKSPACE,
                    "database": app.DB,
                    "counts": summary(c, t),
                    "as_of": json.loads(existing["settings"]).get("demo_as_of"),
                }
            settings = {**company["settings"], "demo_as_of": fixture["as_of"]}
            c.execute(
                "INSERT INTO tenants VALUES(?,?,?,?,?)",
                (t, company["name"], WORKSPACE, json.dumps(settings), app.now()),
            )
            role_ids = app.seed(c, t)
            for role in fixture["roles"]:
                if role["name"] in role_ids:
                    continue
                i = ident("role", role["code"])
                c.execute(
                    "INSERT INTO roles VALUES(?,?,?,?)",
                    (i, t, role["name"], json.dumps(role["permissions"])),
                )
                role_ids[role["name"]] = i
            role_names = {r["code"]: r["name"] for r in fixture["roles"]}
            for user in fixture["users"]:
                salt = secrets.token_hex(16)
                c.execute(
                    "INSERT INTO users VALUES(?,?,?,?,?,?,?,?,?)",
                    (
                        user["id"],
                        t,
                        user["name"],
                        user["email"],
                        salt,
                        app.password_hash(user["initial_password"], salt),
                        role_ids[role_names[user["role_code"]]],
                        user["status"],
                        app.now(),
                    ),
                )
                app.log(
                    c,
                    t,
                    "Demo loader",
                    "UserCreated",
                    user["email"],
                    {"role": role_names[user["role_code"]], "demo_only": True},
                )
            # Remove only default generic categories; all seed defaults are otherwise
            # retained or enriched by their immutable code before dependencies are used.
            c.execute(
                "DELETE FROM records WHERE tenant_id=? AND kind=? AND code IN (?,?)",
                (t, "categories", "CAT-IT", "CAT-EQP"),
            )
            order = [
                "locations",
                "departments",
                "depreciation",
                "categories",
                "models",
                "vendors",
                "sla",
                "services",
                "contracts",
                "taxes",
                "checklists",
                "knowledge",
                "assets",
                "tickets",
                "maintenance",
                "approvals",
                "layouts",
            ]
            for kind in order:
                existing_codes = {r["code"]: r for r in app.records(c, t, kind)}
                for source in fixture["collections"][kind]:
                    app.validate(c, t, kind, source)
                    if source["code"] in existing_codes:
                        # Existing seeded rows retain their database primary key.
                        source = {**source, "id": existing_codes[source["code"]]["id"]}
                        obj = app.update(c, t, kind, source["id"], source)
                    else:
                        obj = app.insert(c, t, kind, source)
                    event = {
                        "assets": "AssetCreated",
                        "tickets": "TicketCreated",
                        "approvals": (
                            "ApprovalRequested"
                            if obj["status"] == "PENDING"
                            else "ApprovalReviewed"
                        ),
                        "maintenance": (
                            "MaintenanceCompleted"
                            if obj["status"] == "COMPLETED"
                            else "PMWorkOrderCreated"
                        ),
                    }.get(kind, "MasterDataCreated")
                    app.emit(c, t, "Demo loader", event, obj)
                    c.execute(
                        "UPDATE records SET created_at=?,updated_at=? WHERE tenant_id=? AND kind=? AND id=?",
                        (
                            source.get("created_at", app.now()),
                            source.get("updated_at", app.now()),
                            t,
                            kind,
                            obj["id"],
                        ),
                    )
            app.run_automation(c, t, "Demo loader")
            app.log(
                c,
                t,
                "Demo loader",
                "DemoCompanyLoaded",
                WORKSPACE,
                {"demo_only": True, "as_of": fixture["as_of"]},
            )
            return {
                "created": True,
                "workspace": WORKSPACE,
                "database": app.DB,
                "counts": summary(c, t),
                "as_of": fixture["as_of"],
            }
    finally:
        app.DB = previous


def snapshot_fixture(fixture):
    """Generate all derived demo records in an isolated temporary database."""
    result = copy.deepcopy(fixture)
    with tempfile.TemporaryDirectory(prefix="assetq-demo-export-") as temp:
        db = Path(temp) / "demo.sqlite3"
        load_demo(db, fixture["as_of"])
        previous = app.DB
        app.DB = str(db)
        try:
            with app.connect() as c:
                t = fixture["company"]["id"]
                result["collections"] = {
                    kind: app.records(c, t, kind) for kind in app.COLLECTIONS
                }
                result["audit"] = [
                    dict(r, details=json.loads(r["details"]))
                    for r in c.execute(
                        "SELECT * FROM audit WHERE tenant_id=? ORDER BY created_at,id",
                        (t,),
                    )
                ]
                user_roles = {
                    r["id"]: r["role_id"]
                    for r in c.execute(
                        "SELECT id,role_id FROM users WHERE tenant_id=?", (t,)
                    )
                }
                role_ids = {
                    r["name"]: r["id"]
                    for r in c.execute(
                        "SELECT id,name FROM roles WHERE tenant_id=?", (t,)
                    )
                }
                for u in result["users"]:
                    u["role_id"] = user_roles[u["id"]]
                for r in result["roles"]:
                    r["id"] = role_ids[r["name"]]
                result["counts"] = summary(c, t)
        finally:
            app.DB = previous
    return result


def write_workbook(path, sheets):
    """Write a plain Excel workbook without introducing a runtime dependency."""
    ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"

    def column(index):
        out = ""
        while index:
            index, remain = divmod(index - 1, 26)
            out = chr(65 + remain) + out
        return out

    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as book:
        overrides = "".join(
            f'<Override PartName="/xl/worksheets/sheet{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            for i in range(1, len(sheets) + 1)
        )
        book.writestr(
            "[Content_Types].xml",
            '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            + overrides
            + "</Types>",
        )
        book.writestr(
            "_rels/.rels",
            '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
        )
        tags = "".join(
            f'<sheet name="{escape(name)}" sheetId="{i}" r:id="rId{i}"/>'
            for i, (name, _) in enumerate(sheets, 1)
        )
        book.writestr(
            "xl/workbook.xml",
            f'<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="{ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>{tags}</sheets></workbook>',
        )
        relations = "".join(
            f'<Relationship Id="rId{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i}.xml"/>'
            for i in range(1, len(sheets) + 1)
        )
        book.writestr(
            "xl/_rels/workbook.xml.rels",
            '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            + relations
            + f'<Relationship Id="rId{len(sheets)+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
        )
        book.writestr(
            "xl/styles.xml",
            f'<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="{ns}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1B6D4D"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
        )
        for i, (name, rows) in enumerate(sheets, 1):
            fields = list(dict.fromkeys(k for r in rows for k in r))
            matrix = [fields] + [[r.get(k, "") for k in fields] for r in rows]
            xml = []
            for ri, values in enumerate(matrix, 1):
                cells = []
                for ci, value in enumerate(values, 1):
                    ref = f"{column(ci)}{ri}"
                    style = ' s="1"' if ri == 1 else ""
                    if isinstance(value, (int, float)) and not isinstance(value, bool):
                        cells.append(f'<c r="{ref}"{style}><v>{value}</v></c>')
                    else:
                        text = (
                            json.dumps(value, ensure_ascii=False)
                            if isinstance(value, (dict, list))
                            else str(value if value is not None else "")
                        )
                        cells.append(
                            f'<c r="{ref}" t="inlineStr"{style}><is><t xml:space="preserve">{escape(text)}</t></is></c>'
                        )
                xml.append(f'<row r="{ri}">' + "".join(cells) + "</row>")
            dimension = f"A1:{column(len(fields))}{len(matrix)}"
            book.writestr(
                f"xl/worksheets/sheet{i}.xml",
                f'<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="{ns}"><dimension ref="{dimension}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="{len(fields)}" width="25" customWidth="1"/></cols><sheetData>'
                + "".join(xml)
                + f'</sheetData><autoFilter ref="{dimension}"/></worksheet>',
            )


def export_fixture(fixture, destination):
    validate_fixture(fixture)
    fixture = snapshot_fixture(fixture)
    out = Path(destination)
    out.mkdir(parents=True, exist_ok=True)
    (out / "company-data.json").write_text(
        json.dumps(fixture, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    def csv_file(name, rows):
        if not rows:
            return
        fields = list(dict.fromkeys(key for r in rows for key in r))
        with (out / (name + ".csv")).open(
            "w", newline="", encoding="utf-8-sig"
        ) as file:
            writer = csv.DictWriter(file, fieldnames=fields)
            writer.writeheader()
            for row in rows:
                writer.writerow(
                    {
                        k: (
                            json.dumps(v, ensure_ascii=False)
                            if isinstance(v, (dict, list))
                            else v
                        )
                        for k, v in row.items()
                    }
                )

    csv_file("audit", fixture["audit"])
    csv_file("users", fixture["users"])
    csv_file("roles", fixture["roles"])
    csv_file(
        "company",
        [{**fixture["company"], "as_of": fixture["as_of"], "demo_only": True}],
    )
    for kind, rows in fixture["collections"].items():
        csv_file(kind, rows)
    for plan in fixture["collections"]["layouts"]:
        (out / (plan["code"] + ".png")).write_bytes(
            base64.b64decode(plan["image"].split(",", 1)[1])
        )
    sheets = (
        [
            ("Company", [fixture["company"]]),
            ("Users", fixture["users"]),
            ("Roles", fixture["roles"]),
        ]
        + [
            (kind.capitalize(), rows)
            for kind, rows in fixture["collections"].items()
            if rows
        ]
        + [("Audit", fixture["audit"])]
    )
    write_workbook(out / "Evergreen-Company-Data.xlsx", sheets)
    initial = fixture["counts"]
    (out / "manifest.json").write_text(
        json.dumps(
            {
                "company": COMPANY_NAME,
                "workspace": WORKSPACE,
                "demo_only": True,
                "as_of": fixture["as_of"],
                "counts": initial,
                "derived_records": "Includes a complete exported snapshot of notifications, automation rules, and audit events. Fresh installations generate these events again through the existing application code.",
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    logins = []
    for r in fixture["roles"]:
        user = next(u for u in fixture["users"] if u["role_code"] == r["code"])
        logins.append(f"| {r['name']} | {user['name']} | `{user['email']}` |")
    readme = (
        f"""# Evergreen Industries — complete AssetQ sample company

This is fictional demonstration data. No real employee, supplier, serial number, or customer credential is included. Purchase management remains excluded.

## Start on Windows

Download the latest project ZIP from GitHub and extract it. Double-click **START_ASSETQ_DEMO.bat**. This installs dependencies, loads this company, and starts AssetQ against a separate demo database. Keep the command window open and use the Local browser address shown there.

Node.js LTS (22.12+) and Python 3.12+ are required. The standard **START_ASSETQ.bat** continues to open your ordinary customer database; it does not load demo data.

## Logins

Workspace ID: **{WORKSPACE}**  
Initial password for every fictional account: **{DEMO_PASSWORD}**

| Role | Person | Email |
|---|---|---|
"""
        + "\n".join(logins)
        + f"""

All 30 accounts, departments, and site assignments are listed in **users.csv** and the **Users** tab of **Evergreen-Company-Data.xlsx**. These are public demo credentials intended for local testing. Do not expose the demo database as a real customer service with these passwords.

## Contents

- 1 company; 3 sites and 26 hierarchical locations; 8 departments/cost centers.
- 30 active users across 7 roles, including finance and maintenance-specific roles.
- 80 assets across 12 categories and 18 models, with assignments, serials, locations, warranty dates, costs, verification, and depreciation classes.
- 36 tickets spanning new, assigned, in progress, pending, resolved, closed, and reopened states.
- 20 maintenance work orders, including completed checklists and overdue/upcoming work.
- 7 approval scenarios: transfer, retirement, disposal, approved, rejected, and pending examples. Different users handle requests and reviews.
- 6 vendors, 8 service/warranty contracts, 5 SLA policies, 6 services, 6 depreciation classes, 3 tax codes, 6 checklists, and 10 knowledge articles.
- 3 sample floor-plan PNGs with correctly scoped asset markers.
- 11 enabled automation rules. Loading generates in-app notifications and audit history, including warranty/SLA warnings and recurring-incident examples.

**Evergreen-Company-Data.xlsx** contains one worksheet per module, including logins, rules, notifications, and audit history. **company-data.json** contains the full fictional export; module CSVs can also be opened individually in Excel. Historical statuses and internal relationships mean these CSVs are not a substitute for the complete-company loader. Notifications, audit logs, and automation defaults are generated through the existing application code when the company is loaded.

Dates in the repository export are anchored to **{fixture['as_of']}**. A new local demo installation computes its dates relative to the day it is first loaded. Rerunning the loader preserves the existing company, user edits, and password changes; it never resets existing data.

## Command-line alternative

From the project directory:

```sh
npm ci
npm run demo
```

Or load data without starting a server:

```sh
npm run demo:seed
```

Default demo database: `.data/assetq-demo.sqlite3`. Demo services use API port 8050 and UI port 5180 so they can run alongside the regular application. Starting a demo while the demo ports already serve a different database is rejected.

## Try these scenarios

1. Sign in as administrator and inspect all users, roles, masters, and the populated dashboard.
2. Sign in as an employee; inspect only their assigned assets and tickets, then raise a new request.
3. As helpdesk agent, open a laptop incident, request local assistance, and add a reply. Suggestions are rule-based unless you separately configure an AI provider.
4. As maintenance technician, complete every checklist step and record findings on a scheduled work order; verify the next service date.
5. As asset manager, review the pending transfer or retirement requests. Submit a new request, then switch to the other asset manager to approve it.
6. As finance analyst, inspect INR book-value estimates and depreciation by class.
7. As auditor, inspect the generated event history.
8. Open Visual workspace and click a placed asset marker. Run automation twice; existing reminders and work orders are deduplicated.
"""
    )
    if (out / "dashboard.png").exists():
        readme += "\n## Preview\n\n![Evergreen Industries populated AssetQ dashboard](dashboard.png)\n"
    (out / "README.md").write_text(readme, encoding="utf-8")
    return out


def main():
    parser = argparse.ArgumentParser(
        description="Load the fictional Evergreen Industries demo without replacing existing data."
    )
    parser.add_argument(
        "--database",
        help="Optional database path; defaults to .data/assetq-demo.sqlite3",
    )
    parser.add_argument("--as-of", help="Optional business-date anchor in YYYY-MM-DD")
    parser.add_argument(
        "--export",
        metavar="DIRECTORY",
        help="Export the fictional definitions as JSON/CSV/PNG",
    )
    parser.add_argument(
        "--export-only",
        action="store_true",
        help="Write exports without changing any database",
    )
    args = parser.parse_args()
    try:
        fixture = build_fixture(args.as_of)
        if args.export:
            export_fixture(fixture, args.export)
        if args.export_only:
            if not args.export:
                parser.error("--export-only requires --export")
            print(f"Exported fictional company to {args.export}")
            return
        result = load_demo(args.database, args.as_of)
        print(
            ("Created" if result["created"] else "Preserved existing")
            + " demo company: "
            + COMPANY_NAME
        )
        print("Workspace: " + WORKSPACE + " | Initial demo password: " + DEMO_PASSWORD)
        print("Database: " + result["database"])
        print(json.dumps(result["counts"], indent=2))
        if not result["created"]:
            print(
                "Existing user edits and changed passwords were preserved. No reset performed."
            )
    except (ValueError, app.APIError) as error:
        print(
            "Demo setup failed: " + str(getattr(error, "msg", error)), file=sys.stderr
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
