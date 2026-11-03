export function toCsv(rows: Array<Array<string | number>>): string {
  return (
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map((value) => {
            const text = String(value);
            const safe =
              typeof value === "string" && /^(?:\s*[=+\-@]|[\t\r\n])/.test(text)
                ? "'" + text
                : text;
            return '"' + safe.replace(/"/g, '""') + '"';
          })
          .join(","),
      )
      .join("\r\n")
  );
}

export function downloadCsv(
  filename: string,
  rows: Array<Array<string | number>>,
) {
  const url = URL.createObjectURL(
    new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
