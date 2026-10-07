import json
import tempfile
import threading
import unittest
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "server"))
import app
import demo
from test_api import APIClient
from http.server import ThreadingHTTPServer


class TestDemoCompany(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.database = Path(self.tmp.name) / "demo.sqlite3"
        self.previous = app.DB
        app.DB = str(self.database)
        app.AUTH_ATTEMPTS.clear()

    def tearDown(self):
        app.DB = self.previous
        self.tmp.cleanup()

    def test_fixture_covers_every_role_and_lifecycle(self):
        fixture = demo.build_fixture("2026-10-07")
        self.assertTrue(demo.validate_fixture(fixture))
        self.assertEqual(len(fixture["users"]), 30)
        self.assertEqual(len(fixture["roles"]), 7)
        self.assertEqual(len(fixture["collections"]["assets"]), 80)
        self.assertEqual(
            {a["status"] for a in fixture["collections"]["assets"]}, set(app.STATE)
        )
        self.assertEqual(len(fixture["collections"]["tickets"]), 36)
        self.assertEqual(len(fixture["collections"]["maintenance"]), 20)
        self.assertEqual(
            len(
                [l for l in fixture["collections"]["locations"] if l["type"] == "SITE"]
            ),
            3,
        )
        self.assertFalse(any("purchase" in k for k in fixture["collections"]))

    def test_loader_preserves_existing_edits_and_passwords(self):
        created = demo.load_demo(self.database)
        self.assertTrue(created["created"])
        self.assertEqual(created["counts"]["assets"], 80)
        self.assertEqual(created["counts"]["maintenance"], 20)
        self.assertGreater(created["counts"]["notifications"], 100)
        self.assertGreater(created["counts"]["audit"], 300)
        with app.connect() as c:
            c.execute(
                "UPDATE users SET name=? WHERE email=?",
                ("Edited Person", "employee@evergreen.example.test"),
            )
            c.execute(
                "UPDATE users SET password=? WHERE email=?",
                ("changed-demo-hash", "employee@evergreen.example.test"),
            )
        again = demo.load_demo(self.database, "2027-01-01")
        self.assertFalse(again["created"])
        self.assertEqual(again["counts"], created["counts"])
        with app.connect() as c:
            u = c.execute(
                "SELECT name,password FROM users WHERE email=?",
                ("employee@evergreen.example.test",),
            ).fetchone()
            self.assertEqual(u["name"], "Edited Person")
            self.assertEqual(u["password"], "changed-demo-hash")

    def test_login_every_role_and_enforce_employee_scope(self):
        demo.load_demo(self.database)
        server = ThreadingHTTPServer(("127.0.0.1", 0), app.Handler)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            url = f"http://127.0.0.1:{server.server_port}"
            representatives = {
                "admin": "Administrator",
                "asset.manager": "Asset manager",
                "helpdesk": "Helpdesk agent",
                "employee": "Employee",
                "auditor": "Auditor",
                "finance": "Finance analyst",
                "technician": "Maintenance technician",
            }
            clients = {}
            for local, role in representatives.items():
                client = APIClient(url)
                status, data = client.req(
                    "/login",
                    "POST",
                    {
                        "workspace": demo.WORKSPACE,
                        "email": local + "@evergreen.example.test",
                        "password": demo.DEMO_PASSWORD,
                    },
                )
                self.assertEqual(status, 200, data)
                self.assertEqual(data["me"]["role"], role)
                clients[local] = client
                if local == "admin":
                    self.assertEqual(len(data["assets"]), 80)
                    self.assertEqual(len(data["users"]), 30)
                if local == "employee":
                    self.assertGreater(len(data["assets"]), 0)
                    self.assertGreater(len(data["tickets"]), 0)
                    self.assertTrue(
                        all(
                            a.get("assigned_user_id") == data["me"]["id"]
                            for a in data["assets"]
                        )
                    )
                    self.assertTrue(
                        all(
                            t["requester_id"] == data["me"]["id"]
                            for t in data["tickets"]
                        )
                    )
                    self.assertEqual(data["users"], [])
                    self.assertEqual(data["audit"], [])
                if local == "finance":
                    self.assertEqual(len(data["assets"]), 80)
                    self.assertTrue(all("cost" in a for a in data["assets"]))
                if local == "auditor":
                    self.assertGreater(len(data["audit"]), 300)
            data = clients["asset.manager"].req("/data")[1]
            approval = next(a for a in data["approvals"] if a["code"] == "APP-001")
            self.assertEqual(
                clients["asset.manager"].req(
                    "/approvals/" + approval["id"], "POST", {"decision": "APPROVED"}
                )[0],
                400,
            )
            self.assertEqual(
                clients["admin"].req(
                    "/approvals/" + approval["id"], "POST", {"decision": "APPROVED"}
                )[0],
                200,
            )
            data = clients["technician"].req("/data")[1]
            work = next(w for w in data["maintenance"] if w["status"] == "SCHEDULED")
            self.assertEqual(
                clients["technician"].req(
                    "/maintenance/" + work["id"] + "/complete",
                    "POST",
                    {
                        "notes": "Checked fictional demo asset",
                        "completed_steps": work["checklist"].split("\n"),
                    },
                )[0],
                200,
            )
        finally:
            server.shutdown()
            server.server_close()

    def test_windows_timezone_metadata_without_iana_database(self):
        from unittest.mock import patch
        from zoneinfo import ZoneInfoNotFoundError

        demo.load_demo(self.database)
        server = ThreadingHTTPServer(("127.0.0.1", 0), app.Handler)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            client = APIClient(f"http://127.0.0.1:{server.server_port}")
            self.assertEqual(
                client.req(
                    "/login",
                    "POST",
                    {
                        "workspace": demo.WORKSPACE,
                        "email": "admin@evergreen.example.test",
                        "password": demo.DEMO_PASSWORD,
                    },
                )[0],
                200,
            )
            with patch("zoneinfo.ZoneInfo", side_effect=ZoneInfoNotFoundError()):
                self.assertEqual(
                    client.req("/settings", "PATCH", {"timezone": "Asia/Kolkata"})[0],
                    200,
                )
                self.assertEqual(
                    client.req("/settings", "PATCH", {"timezone": "Mars/Olympus"})[0],
                    400,
                )
        finally:
            server.shutdown()
            server.server_close()

    def test_existing_workspace_collision_rolls_back(self):
        app.init()
        with app.connect() as c:
            c.execute(
                "INSERT INTO tenants VALUES(?,?,?,?,?)",
                (app.uid(), "Real existing company", demo.WORKSPACE, "{}", app.now()),
            )
        with self.assertRaisesRegex(ValueError, "already used"):
            demo.load_demo(self.database)
        with app.connect() as c:
            self.assertEqual(c.execute("SELECT COUNT(*) FROM tenants").fetchone()[0], 1)
            self.assertEqual(c.execute("SELECT COUNT(*) FROM users").fetchone()[0], 0)

    def test_other_customer_and_database_are_preserved(self):
        app.init()
        customer_id = app.uid()
        with app.connect() as c:
            c.execute(
                "INSERT INTO tenants VALUES(?,?,?,?,?)",
                (customer_id, "Existing customer", "customer-live", "{}", app.now()),
            )
        other_db = Path(self.tmp.name) / "separate-demo.sqlite3"
        demo.load_demo(other_db)
        with app.connect() as c:
            self.assertEqual(c.execute("SELECT COUNT(*) FROM tenants").fetchone()[0], 1)
            self.assertEqual(
                c.execute(
                    "SELECT name FROM tenants WHERE id=?", (customer_id,)
                ).fetchone()[0],
                "Existing customer",
            )
        demo.load_demo(self.database)
        with app.connect() as c:
            self.assertEqual(
                c.execute(
                    "SELECT name FROM tenants WHERE id=?", (customer_id,)
                ).fetchone()[0],
                "Existing customer",
            )

    def test_export_workbook_and_all_relationships(self):
        out = Path(self.tmp.name) / "exports"
        demo.export_fixture(demo.build_fixture(), out)
        data = json.loads((out / "company-data.json").read_text())
        self.assertTrue(demo.validate_fixture(data))
        self.assertTrue(data["collections"]["notifications"])
        self.assertEqual(len(data["collections"]["rules"]), 11)
        self.assertTrue(data["audit"])
        self.assertNotIn("password_hash", (out / "company-data.json").read_text())
        self.assertEqual(data["counts"]["assets"], 80)
        with zipfile.ZipFile(out / "Evergreen-Company-Data.xlsx") as book:
            self.assertIsNone(book.testzip())
            for name in book.namelist():
                if name.endswith((".xml", ".rels")):
                    ET.fromstring(book.read(name))
            ns = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
            workbook = ET.fromstring(book.read("xl/workbook.xml"))
            names = [s.attrib["name"] for s in workbook.findall("x:sheets/x:sheet", ns)]
            self.assertIn("Users", names)
            self.assertIn("Audit", names)
            self.assertIn("Notifications", names)
            sheet = ET.fromstring(book.read("xl/worksheets/sheet2.xml"))
            self.assertEqual(len(sheet.findall("x:sheetData/x:row", ns)), 31)
        self.assertTrue((out / "PLAN-01.png").read_bytes().startswith(b"\x89PNG"))
        self.assertFalse(
            self.database.exists(),
            "Export must not create or modify the active database",
        )

    def test_automation_is_idempotent_after_loading(self):
        result = demo.load_demo(self.database)
        with app.connect() as c:
            actions = app.run_automation(
                c, demo.ident("tenant", demo.WORKSPACE), "Test repeat"
            )
            self.assertEqual(actions, 0)
            self.assertEqual(
                app.records(
                    c, demo.ident("tenant", demo.WORKSPACE), "maintenance"
                ).__len__(),
                20,
            )
            self.assertEqual(
                len(
                    app.records(
                        c, demo.ident("tenant", demo.WORKSPACE), "notifications"
                    )
                ),
                result["counts"]["notifications"],
            )


if __name__ == "__main__":
    unittest.main()
