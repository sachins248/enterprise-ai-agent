/**
 * Table — a generic themed table.
 * `columns`: [{ key, label, align: 'left'|'right', render?(row) }]
 * `rows`: array of data objects
 */
export default function Table({ columns, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px] border-collapse">
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={`font-mono text-[9px] tracking-micro uppercase text-ink-3 font-normal
                  border-b border-hairline py-2 ${col.align === 'right' ? 'text-right' : 'text-left pr-6'}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i}>
              {columns.map(col => (
                <td
                  key={col.key}
                  className={`py-2.5 border-b border-hairline ${col.align === 'right' ? 'text-right' : 'pr-6'}
                    ${col.mono ? 'font-mono text-[12px] text-ink-2' : 'text-ink'}`}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
