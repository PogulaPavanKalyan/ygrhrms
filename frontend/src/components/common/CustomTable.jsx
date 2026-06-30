import React from 'react';

const CustomTable = ({ headers, children, emptyMessage = 'No records found.' }) => {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((h, idx) => (
              <th key={idx}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children || (
            <tr>
              <td colSpan={headers.length} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CustomTable;
