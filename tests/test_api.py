import unittest, tempfile, threading, json, urllib.request, urllib.error, http.cookiejar, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "server"))
import app
from http.server import ThreadingHTTPServer


class APIClient:
    def __init__(self, url):
        self.url = url
        self.client = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar())
        )

    def req(self, path, method="GET", data=None):
        req = urllib.request.Request(
            self.url + "/api" + path,
            data=json.dumps(data).encode() if data is not None else None,
            headers={"Content-Type": "application/json"},
            method=method,
        )
        try:
            with self.client.open(req) as r:
                return r.status, json.load(r)
        except urllib.error.HTTPError as r:
            return r.code, json.load(r)


class TestAssetQ(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        app.DB = str(Path(cls.tmp.name) / "test.db")
        app.init()
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), app.Handler)
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.url = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.tmp.cleanup()

    def setUp(self):
        app.AUTH_ATTEMPTS.clear()
        self.admin = APIClient(self.url)
        self.workspace = "test-" + app.uid()[:8]
        status, self.data = self.admin.req(
            "/register",
            "POST",
            {
                "organization": "Test Company",
                "workspace": self.workspace,
                "name": "Owner",
                "email": "owner@example.test",
                "password": "SafePassword123!",
            },
        )
        self.assertEqual(status, 201, self.data)
        self.location = self.create(
            "locations", {"code": "HQ", "name": "Headquarters", "type": "SITE"}
        )
        self.create(
            "departments",
            {"code": "ENG", "name": "Engineering", "cost_center": "CC-001"},
        )
        self.asset = self.create(
            "assets",
            {
                "code": "AST-001",
                "name": "Test laptop",
                "category_code": "CAT-IT",
                "location_code": "HQ",
                "status": "IN_STOCK",
                "cost": 1200,
                "warranty_end": "2020-01-01",
                "next_due": "2020-01-01",
            },
        )

    def create(self, k, d):
        status, result = self.admin.req("/records/" + k, "POST", d)
        self.assertEqual(status, 201, result)
        return result

    def user(self, name="Employee", role="Employee"):
        role_id = next(r["id"] for r in self.data["roles"] if r["name"] == role)
        status, result = self.admin.req(
            "/users",
            "POST",
            {
                "name": name,
                "email": name.lower() + "@example.test",
                "password": "SafePassword123!",
                "role_id": role_id,
            },
        )
        self.assertEqual(status, 201, result)
        client = APIClient(self.url)
        status, d = client.req(
            "/login",
            "POST",
            {
                "workspace": self.workspace,
                "email": name.lower() + "@example.test",
                "password": "SafePassword123!",
            },
        )
        self.assertEqual(status, 200, d)
        return result["id"], client

    def test_registration_defaults_and_password(self):
        self.assertEqual(len(self.data["rules"]), 11)
        self.assertEqual(len(self.data["sla"]), 5)
        self.assertEqual(self.data["assets"], [])
        anon = APIClient(self.url)
        self.assertEqual(anon.req("/data")[0], 401)
        self.assertEqual(
            anon.req(
                "/login",
                "POST",
                {
                    "workspace": self.workspace,
                    "email": "owner@example.test",
                    "password": "wrong",
                },
            )[0],
            401,
        )

    def test_tenant_isolation(self):
        other = APIClient(self.url)
        status, d = other.req(
            "/register",
            "POST",
            {
                "organization": "Other",
                "workspace": "other-" + app.uid()[:8],
                "name": "Other",
                "email": "owner@example.test",
                "password": "SafePassword123!",
            },
        )
        self.assertEqual(status, 201)
        self.assertEqual(d["assets"], [])
        self.assertEqual(
            other.req(
                "/records/assets/" + self.asset["id"], "PATCH", {"name": "Stolen"}
            )[0],
            404,
        )
        self.assertEqual(
            other.req(
                "/assets/" + self.asset["id"] + "/request",
                "POST",
                {"action": "RETIRED", "reason": "No"},
            )[0],
            404,
        )

    def test_employee_visibility_and_access(self):
        i, employee = self.user()
        status, d = employee.req("/data")
        self.assertEqual(d["assets"], [])
        self.assertEqual(d["users"], [])
        self.assertEqual(d["audit"], [])
        self.assertEqual(
            employee.req("/records/assets", "POST", {"name": "No"})[0], 403
        )
        self.assertEqual(
            employee.req(
                "/records/tickets",
                "POST",
                {"name": "My laptop failed", "asset_id": self.asset["id"]},
            )[0],
            403,
        )
        self.admin.req(
            "/records/assets/" + self.asset["id"],
            "PATCH",
            {"status": "ASSIGNED", "assigned_user_id": i},
        )
        status, d = employee.req("/data")
        self.assertEqual(len(d["assets"]), 1)
        self.assertNotIn("cost", d["assets"][0])
        status, ticket = employee.req(
            "/records/tickets",
            "POST",
            {
                "name": "Laptop cannot boot",
                "description": "Black screen",
                "asset_id": self.asset["id"],
                "priority": "P2",
            },
        )
        self.assertEqual(status, 201, ticket)
        self.assertTrue(ticket["due_at"])
        self.assertEqual(ticket["group"], "IT support")
        self.assertEqual(
            employee.req(
                "/tickets/" + ticket["id"] + "/comments",
                "POST",
                {"body": "More context"},
            )[0],
            200,
        )
        self.assertEqual(
            employee.req(
                "/records/tickets/" + ticket["id"], "PATCH", {"status": "CLOSED"}
            )[0],
            403,
        )

    def test_immutable_codes_and_foreign_keys(self):
        self.assertEqual(
            self.admin.req(
                "/records/assets/" + self.asset["id"], "PATCH", {"code": "CHANGED"}
            )[0],
            400,
        )
        self.assertEqual(
            self.admin.req(
                "/records/assets",
                "POST",
                {
                    "name": "Bad location",
                    "category_code": "CAT-IT",
                    "location_code": "MISSING",
                },
            )[0],
            400,
        )
        self.assertEqual(
            self.admin.req(
                "/records/assets",
                "POST",
                {
                    "name": "Bypass",
                    "category_code": "CAT-IT",
                    "location_code": "HQ",
                    "status": "DISPOSED",
                },
            )[0],
            400,
        )

    def test_governed_lifecycle(self):
        self.assertEqual(
            self.admin.req(
                "/records/assets/" + self.asset["id"], "PATCH", {"status": "RETIRED"}
            )[0],
            400,
        )
        status, approval = self.admin.req(
            "/assets/" + self.asset["id"] + "/request",
            "POST",
            {"action": "RETIRED", "reason": "End of service life"},
        )
        self.assertEqual(status, 201, approval)
        self.assertEqual(
            self.admin.req(
                "/approvals/" + approval["id"], "POST", {"decision": "APPROVED"}
            )[0],
            400,
        )
        self.assertEqual(
            self.admin.req(
                "/records/approvals/" + approval["id"], "PATCH", {"status": "APPROVED"}
            )[0],
            403,
        )
        i, reviewer = self.user("Reviewer", "Asset manager")
        status, r = reviewer.req(
            "/approvals/" + approval["id"], "POST", {"decision": "APPROVED"}
        )
        self.assertEqual(status, 200, r)
        status, d = self.admin.req("/data")
        self.assertEqual(d["assets"][0]["status"], "RETIRED")
        self.assertEqual(
            reviewer.req(
                "/approvals/" + approval["id"], "POST", {"decision": "APPROVED"}
            )[0],
            400,
        )

    def test_automation_idempotence_and_completion(self):
        status, result = self.admin.req("/automation/run", "POST", {})
        self.assertEqual(status, 200, result)
        self.assertEqual(result["actions"], 2)
        self.assertEqual(self.admin.req("/automation/run", "POST", {})[1]["actions"], 0)
        d = self.admin.req("/data")[1]
        self.assertEqual(len(d["maintenance"]), 1)
        w = d["maintenance"][0]
        self.assertEqual(
            self.admin.req("/maintenance/" + w["id"] + "/complete", "POST", {})[0], 400
        )
        status, r = self.admin.req(
            "/maintenance/" + w["id"] + "/complete",
            "POST",
            {
                "notes": "Safety checks passed",
                "completed_steps": [
                    "Inspect condition",
                    "Perform safety checks",
                    "Record findings",
                ],
            },
        )
        self.assertEqual(status, 200, r)
        self.assertEqual(r["status"], "COMPLETED")
        self.assertGreater(
            self.admin.req("/data")[1]["assets"][0]["next_due"], "2020-01-01"
        )

    def test_rule_toggle_and_audit(self):
        rule = next(r for r in self.data["rules"] if r["event"] == "WarrantyExpiring")
        self.assertEqual(
            self.admin.req("/rules/" + rule["id"], "PATCH", {"enabled": False})[0], 200
        )
        self.assertEqual(self.admin.req("/automation/run", "POST", {})[1]["actions"], 1)
        self.assertTrue(
            any(
                r["event"] == "AutomationRuleUpdated"
                for r in self.admin.req("/data")[1]["audit"]
            )
        )

    def test_helpdesk_assistance_and_sla(self):
        self.create(
            "tickets",
            {
                "name": "All users network outage",
                "description": "Critical internet failure",
                "priority": "P1",
            },
        )
        status, d = self.admin.req(
            "/assist",
            "POST",
            {"name": "All users network outage", "description": "No connection"},
        )
        self.assertEqual(status, 200)
        self.assertEqual(d["category"], "Network")
        self.assertEqual(d["priority"], "P1")
        self.assertTrue(d["duplicates"])
        self.assertTrue(d["articles"])
        ticket = self.admin.req("/data")[1]["tickets"][0]
        self.assertEqual(
            self.admin.req(
                "/records/tickets/" + ticket["id"], "PATCH", {"due_at": "2050-01-01"}
            )[0],
            400,
        )
        self.assertEqual(
            self.admin.req(
                "/tickets/" + ticket["id"] + "/comments",
                "POST",
                {"body": "Network team investigating"},
            )[0],
            200,
        )

    def test_onboarding_go_live(self):
        self.assertEqual(self.admin.req("/settings", "PATCH", {"live": True})[0], 400)
        self.admin.req("/settings", "PATCH", {"reviewed": True})
        self.assertEqual(self.admin.req("/settings", "PATCH", {"live": True})[0], 400)
        self.user()
        status, d = self.admin.req("/settings", "PATCH", {"live": True})
        self.assertEqual(status, 200, d)
        self.assertTrue(d["live"])

    def test_layout_and_archive(self):
        plan = self.create("layouts", {"name": "HQ plan", "location_code": "HQ"})
        self.assertEqual(
            self.admin.req(
                "/records/layouts/" + plan["id"],
                "PATCH",
                {"mappings": [{"asset_id": self.asset["id"], "x": 33, "y": 51}]},
            )[0],
            200,
        )
        self.assertEqual(
            self.admin.req(
                "/records/layouts/" + plan["id"],
                "PATCH",
                {"mappings": [{"asset_id": self.asset["id"], "x": 333, "y": 51}]},
            )[0],
            400,
        )
        self.assertEqual(
            self.admin.req(
                "/records/locations/" + self.location["id"],
                "PATCH",
                {"status": "ARCHIVED"},
            )[0],
            200,
        )

    def test_custom_role_and_blocked_sessions(self):
        status, r = self.admin.req(
            "/roles", "POST", {"name": "Read-only self-service", "permissions": []}
        )
        self.assertEqual(status, 201, r)
        i, employee = self.user()
        self.admin.req("/users/" + i, "PATCH", {"status": "BLOCKED"})
        self.assertEqual(employee.req("/data")[0], 401)

    def test_system_field_protection(self):
        self.assertEqual(
            self.admin.req(
                "/records/tickets",
                "POST",
                {
                    "name": "Fake",
                    "id": app.uid(),
                    "requester_id": self.data["me"]["id"],
                },
            )[0],
            400,
        )
        self.assertEqual(
            self.admin.req(
                "/records/rules/" + self.data["rules"][0]["id"],
                "PATCH",
                {"event": "Other"},
            )[0],
            403,
        )
        self.assertEqual(
            self.admin.req(
                "/records/assets/" + self.asset["id"], "PATCH", {"id": "other"}
            )[0],
            400,
        )

    def test_atomic_csv_import(self):
        rows = [
            {
                "code": "IMP-001",
                "name": "Imported asset",
                "category_code": "CAT-IT",
                "location_code": "HQ",
                "cost": 500,
            },
            {
                "code": "IMP-002",
                "name": "Invalid",
                "category_code": "CAT-IT",
                "location_code": "BAD",
            },
        ]
        self.assertEqual(
            self.admin.req("/assets/import", "POST", {"rows": rows})[0], 400
        )
        self.assertEqual(len(self.admin.req("/data")[1]["assets"]), 1)
        rows[1]["location_code"] = "HQ"
        status, r = self.admin.req("/assets/import", "POST", {"rows": rows})
        self.assertEqual(status, 201, r)
        self.assertEqual(r["created"], 2)
        self.assertEqual(
            self.admin.req("/assets/import", "POST", {"rows": rows})[0], 409
        )
        self.assertEqual(len(self.admin.req("/data")[1]["assets"]), 3)

    def test_configurable_rule_threshold(self):
        rule = next(r for r in self.data["rules"] if r["event"] == "WarrantyExpiring")
        status, r = self.admin.req("/rules/" + rule["id"], "PATCH", {"threshold": 60})
        self.assertEqual(status, 200)
        self.assertEqual(r["threshold"], 60)
        self.assertEqual(
            self.admin.req("/rules/" + rule["id"], "PATCH", {"threshold": -1})[0], 400
        )

    def test_password_rotation(self):
        status, r = self.admin.req(
            "/password",
            "POST",
            {"current_password": "wrong", "new_password": "ChangedPassword123!"},
        )
        self.assertEqual(status, 403)
        status, r = self.admin.req(
            "/password",
            "POST",
            {
                "current_password": "SafePassword123!",
                "new_password": "ChangedPassword123!",
            },
        )
        self.assertEqual(status, 200, r)
        self.assertEqual(self.admin.req("/data")[0], 200)
        other = APIClient(self.url)
        self.assertEqual(
            other.req(
                "/login",
                "POST",
                {
                    "workspace": self.workspace,
                    "email": "owner@example.test",
                    "password": "SafePassword123!",
                },
            )[0],
            401,
        )
        self.assertEqual(
            other.req(
                "/login",
                "POST",
                {
                    "workspace": self.workspace,
                    "email": "owner@example.test",
                    "password": "ChangedPassword123!",
                },
            )[0],
            200,
        )

    def test_employee_assistance_privacy(self):
        self.create(
            "tickets",
            {
                "name": "Confidential network outage",
                "description": "Private executive issue",
            },
        )
        i, employee = self.user()
        status, d = employee.req(
            "/assist", "POST", {"name": "Confidential network outage"}
        )
        self.assertEqual(status, 200)
        self.assertEqual(d["duplicates"], [])

    def test_checklist_required_and_sla_resolution(self):
        work = self.create(
            "maintenance",
            {
                "name": "Service",
                "asset_id": self.asset["id"],
                "checklist": "Step one\nStep two",
            },
        )
        self.assertEqual(
            self.admin.req(
                "/maintenance/" + work["id"] + "/complete",
                "POST",
                {"notes": "Done", "completed_steps": ["Step one"]},
            )[0],
            400,
        )
        self.assertEqual(
            self.admin.req(
                "/maintenance/" + work["id"] + "/complete",
                "POST",
                {"notes": "Done", "completed_steps": ["Step one", "Step two"]},
            )[0],
            200,
        )
        ticket = self.create(
            "tickets", {"name": "Laptop not booting", "asset_id": self.asset["id"]}
        )
        self.assertEqual(
            self.admin.req(
                "/records/tickets/" + ticket["id"], "PATCH", {"status": "IN_PROGRESS"}
            )[0],
            200,
        )
        self.assertEqual(self.admin.req("/data")[1]["assets"][0]["status"], "IN_REPAIR")
        status, r = self.admin.req(
            "/records/tickets/" + ticket["id"], "PATCH", {"status": "RESOLVED"}
        )
        self.assertEqual(status, 200)
        self.assertIn("resolved_at", r)
        self.assertEqual(self.admin.req("/data")[1]["assets"][0]["status"], "IN_STOCK")


if __name__ == "__main__":
    unittest.main()
