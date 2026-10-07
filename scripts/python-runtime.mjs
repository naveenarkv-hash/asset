import { spawnSync } from "node:child_process";

export function pythonExecutable() {
  const candidates = process.env.ASSETQ_PYTHON
    ? [[process.env.ASSETQ_PYTHON, []]]
    : process.platform === "win32"
      ? [
          ["py", ["-3"]],
          ["python", []],
        ]
      : [
          ["python3", []],
          ["python", []],
        ];
  for (const [command, prefix] of candidates) {
    const result = spawnSync(
      command,
      [
        ...prefix,
        "-c",
        'import sys,json; print(json.dumps({"executable":sys.executable,"version":list(sys.version_info[:2])}))',
      ],
      { encoding: "utf8", windowsHide: true },
    );
    if (result.status !== 0) continue;
    try {
      const runtime = JSON.parse(result.stdout);
      if (runtime.version[0] === 3 && runtime.version[1] >= 12)
        return runtime.executable;
    } catch {}
  }
  throw new Error(
    "AssetQ requires Python 3.12 or newer. Install Python, reopen your terminal, and try again.",
  );
}
