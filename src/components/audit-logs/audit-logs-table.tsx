'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AuditLog {
  date: string;
  user: string;
  description: string;
}

interface AuditLogsTableProps {
  rowId: string;
  tableName: string;
}

export function AuditLogsTable({ rowId, tableName }: AuditLogsTableProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/audit-logs?rowId=${rowId}&tableName=${tableName}`)
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs || []);
        setError(null);
      })
      .catch(() => setError('Failed to fetch audit logs'))
      .finally(() => setLoading(false));
  }, [rowId, tableName]);

  return (
    <div>
      <h3 className="text-base font-semibold mb-3">Audit Log</h3>
      {loading ? (
        <div className="text-muted-foreground text-xs">Loading...</div>
      ) : error ? (
        <div className="text-destructive text-xs">{error}</div>
      ) : logs.length === 0 ? (
        <div className="text-muted-foreground text-xs">No audit log entries.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100">
              <TableHead className="w-40 text-xs font-semibold text-muted-foreground">Date</TableHead>
              <TableHead className="w-40 text-xs font-semibold text-muted-foreground">User</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log, i) => (
              <TableRow key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <TableCell className="align-top text-xs text-muted-foreground whitespace-nowrap">{log.date}</TableCell>
                <TableCell className="align-top text-xs font-medium text-primary whitespace-nowrap">{log.user}</TableCell>
                <TableCell className="align-top text-xs text-gray-900 whitespace-pre-line">{log.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
} 