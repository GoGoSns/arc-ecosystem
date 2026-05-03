'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { isAddress } from 'viem';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Users, Plus, Edit, Trash2, Play, Check, X, ExternalLink,
  History, AlertCircle, Search, Download, Upload, Wallet,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { sendUSDC } from '@/lib/payments';
import { parseUSDC, formatUSDC } from '@/lib/usdc';

// ─── Constants ─────────────────────────────────────────────────────────────────

const ARCSCAN = 'https://testnet.arcscan.app/tx/';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  name: string;
  address: string;
  salary: string;
  role?: string;
  email?: string;
  notes?: string;
  lastPaid?: number;
}

type TxStatus = 'pending' | 'submitting' | 'success' | 'failed';

interface TxResult {
  employeeId: string;
  employeeName: string;
  employeeAddress: string;
  amount: string;
  status: TxStatus;
  hash?: string;
  error?: string;
}

interface PayrollRun {
  id: string;
  date: number;
  results: TxResult[];
  total: string;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

interface PayrollState {
  employees: Employee[];
  runs: PayrollRun[];
  addEmployee: (emp: Employee) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;
  addRun: (run: PayrollRun) => void;
}

const usePayrollStore = create<PayrollState>()(
  persist(
    (set) => ({
      employees: [],
      runs: [],
      addEmployee: (emp) => set((s) => ({ employees: [...s.employees, emp] })),
      updateEmployee: (id, updates) =>
        set((s) => ({
          employees: s.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
      removeEmployee: (id) =>
        set((s) => ({ employees: s.employees.filter((e) => e.id !== id) })),
      addRun: (run) => set((s) => ({ runs: [run, ...s.runs] })),
    }),
    { name: 'arcpay:payroll' }
  )
);

// ─── Helpers ───────────────────────────────────────────────────────────────────

function shortenAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function sumSalaries(list: Employee[]): bigint {
  return list.reduce((acc, e) => {
    try { return acc + parseUSDC(e.salary); } catch { return acc; }
  }, BigInt(0));
}

const inputCls = 'w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors';
const inputSt: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  color: 'var(--fg)',
};
const onFocusAccent = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
  (e.target.style.borderColor = 'var(--accent)');
const onBlurBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
  (e.target.style.borderColor = 'var(--border)');

// ─── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, px = 32 }: { name: string; px?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-xs font-bold shrink-0"
      style={{
        width: px,
        height: px,
        background: 'rgba(201,168,76,0.15)',
        color: 'var(--accent)',
      }}
    >
      {getInitials(name)}
    </div>
  );
}

// ─── TxBadge ───────────────────────────────────────────────────────────────────

function TxBadge({ status }: { status: TxStatus }) {
  const map: Record<TxStatus, { label: string; color: string; bg: string }> = {
    pending:    { label: 'Pending',  color: 'var(--fg)', bg: 'rgba(128,128,128,0.1)' },
    submitting: { label: 'Sending…', color: '#f59e0b',   bg: 'rgba(245,158,11,0.12)' },
    success:    { label: 'Paid',     color: '#4ade80',   bg: 'rgba(74,222,128,0.12)' },
    failed:     { label: 'Failed',   color: '#f87171',   bg: 'rgba(248,113,113,0.12)' },
  };
  const m = map[status];
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
      style={{ color: m.color, background: m.bg }}
    >
      {m.label}
    </span>
  );
}

// ─── Employee Modal ─────────────────────────────────────────────────────────────

function EmployeeModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Employee;
  onSave: (emp: Employee) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [addr, setAddr] = useState(initial?.address ?? '');
  const [salary, setSalary] = useState(initial?.salary ?? '');
  const [role, setRole] = useState(initial?.role ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function save() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Required';
    if (!addr.trim() || !isAddress(addr.trim())) errs.addr = 'Invalid Ethereum address';
    const sal = parseFloat(salary);
    if (!salary || isNaN(sal) || sal <= 0) errs.salary = 'Must be greater than 0';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      address: addr.trim(),
      salary: sal.toFixed(2),
      role: role.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      lastPaid: initial?.lastPaid,
    });
  }

  const errBlur = (key: string) => (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = errors[key] ? '#f87171' : 'var(--border)');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4 my-auto"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ color: 'var(--fg)' }}>
            {initial ? 'Edit Employee' : 'Add Employee'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border"
            style={{ border: '1px solid var(--border)', color: 'var(--fg)' }}
          >
            <X size={14} />
          </button>
        </div>

        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--fg)', opacity: 0.55 }}>Name *</label>
          <input
            className={inputCls}
            style={{ ...inputSt, borderColor: errors.name ? '#f87171' : 'var(--border)' }}
            placeholder="Alice Smith"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
            onFocus={onFocusAccent}
            onBlur={errBlur('name')}
          />
          {errors.name && <p className="text-xs text-red-400 mt-0.5">{errors.name}</p>}
        </div>

        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--fg)', opacity: 0.55 }}>Wallet Address *</label>
          <input
            className={`${inputCls} font-mono`}
            style={{ ...inputSt, borderColor: errors.addr ? '#f87171' : 'var(--border)' }}
            placeholder="0x…"
            value={addr}
            onChange={(e) => { setAddr(e.target.value); setErrors((p) => ({ ...p, addr: '' })); }}
            onFocus={onFocusAccent}
            onBlur={errBlur('addr')}
          />
          {errors.addr && <p className="text-xs text-red-400 mt-0.5">{errors.addr}</p>}
        </div>

        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--fg)', opacity: 0.55 }}>Salary (USDC) *</label>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold"
              style={{ color: 'var(--accent)' }}
            >
              USDC
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              className={`${inputCls} pl-14 text-right font-mono`}
              style={{ ...inputSt, borderColor: errors.salary ? '#f87171' : 'var(--border)' }}
              placeholder="0.00"
              value={salary}
              onChange={(e) => { setSalary(e.target.value); setErrors((p) => ({ ...p, salary: '' })); }}
              onFocus={onFocusAccent}
              onBlur={errBlur('salary')}
            />
          </div>
          {errors.salary && <p className="text-xs text-red-400 mt-0.5">{errors.salary}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--fg)', opacity: 0.55 }}>Role / Title</label>
            <input
              className={inputCls}
              style={inputSt}
              placeholder="Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onFocus={onFocusAccent}
              onBlur={onBlurBorder}
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--fg)', opacity: 0.55 }}>Email</label>
            <input
              type="email"
              className={inputCls}
              style={inputSt}
              placeholder="alice@co.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={onFocusAccent}
              onBlur={onBlurBorder}
            />
          </div>
        </div>

        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--fg)', opacity: 0.55 }}>Notes</label>
          <textarea
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none transition-colors"
            style={inputSt}
            placeholder="Optional notes…"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onFocus={onFocusAccent}
            onBlur={onBlurBorder}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={save}
            className="sweep flex-1 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'var(--accent)', color: '#0a0a0a' }}
          >
            {initial ? 'Save Changes' : 'Add Employee'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm border"
            style={{ border: '1px solid var(--border)', color: 'var(--fg)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Remove Modal ───────────────────────────────────────────────────────

function ConfirmRemove({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold" style={{ color: 'var(--fg)' }}>Remove employee?</h2>
        <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.6 }}>
          <strong>{name}</strong> will be removed from payroll.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: '#f87171', color: '#fff' }}
          >
            Remove
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm border"
            style={{ border: '1px solid var(--border)', color: 'var(--fg)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tx List ───────────────────────────────────────────────────────────────────

function TxList({
  results,
  currentIdx,
  isRunning,
}: {
  results: TxResult[];
  currentIdx: number;
  isRunning: boolean;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
    >
      {results.map((r, i) => (
        <div
          key={r.employeeId}
          className="flex items-center gap-3 px-4 py-3"
          style={{
            borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
            background: i === currentIdx && isRunning ? 'rgba(201,168,76,0.04)' : 'transparent',
          }}
        >
          <Avatar name={r.employeeName} px={32} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--fg)' }}>{r.employeeName}</p>
            {r.error && <p className="text-xs text-red-400 truncate">{r.error}</p>}
          </div>
          <span className="text-sm font-mono shrink-0" style={{ color: 'var(--accent)' }}>${r.amount}</span>
          <TxBadge status={r.status} />
          {r.hash && (
            <a
              href={`${ARCSCAN}${r.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)' }}
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── History Panel ──────────────────────────────────────────────────────────────

function HistoryPanel({ runs }: { runs: PayrollRun[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (runs.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 py-20 rounded-2xl"
        style={{ border: '1px dashed var(--border)' }}
      >
        <History size={32} style={{ color: 'var(--fg)', opacity: 0.15 }} />
        <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.4 }}>No payroll runs yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {runs.map((run) => {
        const ok   = run.results.filter((r) => r.status === 'success').length;
        const fail = run.results.filter((r) => r.status === 'failed').length;
        const open = expanded === run.id;
        return (
          <div
            key={run.id}
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
          >
            <button
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
              onClick={() => setExpanded(open ? null : run.id)}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{fmtDate(run.date)}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--fg)', opacity: 0.5 }}>
                  {run.results.length} employees · ${run.total} USDC ·{' '}
                  <span style={{ color: '#4ade80' }}>{ok} paid</span>
                  {fail > 0 && <span style={{ color: '#f87171' }}> · {fail} failed</span>}
                </p>
              </div>
              {open
                ? <ChevronUp size={16} style={{ color: 'var(--fg)', opacity: 0.4 }} />
                : <ChevronDown size={16} style={{ color: 'var(--fg)', opacity: 0.4 }} />}
            </button>

            {open && (
              <div style={{ borderTop: '1px solid var(--border)' }}>
                {run.results.map((r, i) => (
                  <div
                    key={r.employeeId + i}
                    className="flex items-center gap-3 px-4 py-2.5"
                    style={{ borderBottom: i < run.results.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <Avatar name={r.employeeName} px={28} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--fg)' }}>{r.employeeName}</p>
                      <p className="text-xs font-mono" style={{ color: 'var(--fg)', opacity: 0.4 }}>{shortenAddr(r.employeeAddress)}</p>
                    </div>
                    <span className="text-sm font-mono shrink-0" style={{ color: 'var(--accent)' }}>${r.amount}</span>
                    <TxBadge status={r.status} />
                    {r.hash && (
                      <a href={`${ARCSCAN}${r.hash}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type Step = 'list' | 'review' | 'executing' | 'done';
type Tab  = 'employees' | 'history';

export default function PayrollPage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { employees, runs, addEmployee, updateEmployee, removeEmployee, addRun } = usePayrollStore();

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const [tab, setTab]               = useState<Tab>('employees');
  const [step, setStep]             = useState<Step>('list');
  const [search, setSearch]         = useState('');
  const [modal, setModal]           = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<Employee | undefined>();
  const [confirmId, setConfirmId]   = useState<string | null>(null);
  const [txResults, setTxResults]   = useState<TxResult[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isRunning, setIsRunning]   = useState(false);

  const totalRaw   = sumSalaries(employees);
  const totalStr   = formatUSDC(totalRaw);
  const filtered   = employees.filter(
    (e) => !search || e.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleSave(emp: Employee) {
    if (modal === 'edit') updateEmployee(emp.id, emp);
    else addEmployee(emp);
    setModal(null);
  }

  function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = (ev.target?.result as string).split('\n').filter(Boolean);
      const start = lines[0]?.toLowerCase().includes('name') ? 1 : 0;
      lines.slice(start).forEach((line) => {
        const [n, a, s] = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        const sal = parseFloat(s);
        if (!n || !isAddress(a) || isNaN(sal) || sal <= 0) return;
        addEmployee({ id: crypto.randomUUID(), name: n, address: a, salary: sal.toFixed(2) });
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleCSVExport() {
    const rows = ['name,address,salary,role,email'];
    employees.forEach((e) =>
      rows.push(`"${e.name}","${e.address}","${e.salary}","${e.role ?? ''}","${e.email ?? ''}"`)
    );
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'payroll-employees.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const runPayroll = useCallback(async () => {
    if (employees.length === 0) return;
    setIsRunning(true);
    setStep('executing');

    const initial: TxResult[] = employees.map((e) => ({
      employeeId: e.id,
      employeeName: e.name,
      employeeAddress: e.address,
      amount: e.salary,
      status: 'pending' as TxStatus,
    }));
    setTxResults(initial);
    const final = [...initial];

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      setCurrentIdx(i);
      final[i] = { ...final[i], status: 'submitting' };
      setTxResults([...final]);

      try {
        const { txHash } = await sendUSDC(emp.address, emp.salary);
        final[i] = { ...final[i], status: 'success', hash: txHash };
        setTxResults([...final]);
        updateEmployee(emp.id, { lastPaid: Date.now() });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message.slice(0, 120) : 'Transaction failed';
        final[i] = { ...final[i], status: 'failed', error: msg };
        setTxResults([...final]);
      }
    }

    addRun({ id: crypto.randomUUID(), date: Date.now(), results: final, total: totalStr });
    setIsRunning(false);
    setStep('done');
  }, [employees, updateEmployee, addRun, totalStr]);

  // ── Not connected ──────────────────────────────────────────────────────────────

  if (hydrated && !isConnected) {
    return (
      <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(201,168,76,0.1)' }}
          >
            <Wallet size={24} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>Connect your wallet</h2>
          <p className="text-sm max-w-xs" style={{ color: 'var(--fg)', opacity: 0.55 }}>
            You need a connected wallet to run payroll on Arc Testnet.
          </p>
          <button
            onClick={() => connect({ connector: injected() })}
            className="sweep px-6 py-2.5 rounded-xl text-sm font-bold mt-2"
            style={{ background: 'var(--accent)', color: '#0a0a0a' }}
          >
            Connect Wallet
          </button>
        </main>
      </div>
    );
  }

  if (!hydrated) {
    return (
      <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
        <Navbar />
      </div>
    );
  }

  // ── Executing ──────────────────────────────────────────────────────────────────

  if (step === 'executing') {
    const done = txResults.filter((r) => r.status === 'success' || r.status === 'failed').length;
    const pct  = txResults.length > 0 ? (done / txResults.length) * 100 : 0;
    return (
      <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10">
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--accent)' }}>Running Payroll</h1>
              <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
                {isRunning ? `Paying ${currentIdx + 1} of ${txResults.length}…` : 'All transactions submitted'}
              </p>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: 'var(--accent)' }}
              />
            </div>
            <TxList results={txResults} currentIdx={currentIdx} isRunning={isRunning} />
          </div>
        </main>
      </div>
    );
  }

  // ── Done ───────────────────────────────────────────────────────────────────────

  if (step === 'done') {
    const ok   = txResults.filter((r) => r.status === 'success').length;
    const fail = txResults.filter((r) => r.status === 'failed').length;
    return (
      <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10">
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: fail > 0 ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)' }}
              >
                {fail > 0 ? <AlertCircle size={28} color="#f87171" /> : <Check size={28} color="#4ade80" />}
              </div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--fg)' }}>
                {fail > 0 ? 'Completed with Errors' : 'Payroll Complete!'}
              </h1>
              <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.55 }}>
                {ok} paid successfully{fail > 0 ? `, ${fail} failed` : ''}
              </p>
            </div>
            <TxList results={txResults} currentIdx={currentIdx} isRunning={false} />
            <div className="flex gap-3">
              <button
                onClick={() => { setStep('list'); setTxResults([]); }}
                className="sweep flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: 'var(--accent)', color: '#0a0a0a' }}
              >
                Back to Payroll
              </button>
              <button
                onClick={() => { setTab('history'); setStep('list'); setTxResults([]); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                style={{ border: '1px solid var(--border)', color: 'var(--fg)' }}
              >
                View History
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Review ─────────────────────────────────────────────────────────────────────

  if (step === 'review') {
    return (
      <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10">
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--accent)' }}>Review Payroll</h1>
              <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
                You&apos;re about to pay{' '}
                <strong style={{ color: 'var(--fg)' }}>{employees.length}</strong>{' '}
                employee{employees.length !== 1 ? 's' : ''}, total{' '}
                <strong style={{ color: 'var(--fg)' }}>{totalStr} USDC</strong>
              </p>
            </div>

            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
            >
              {employees.map((emp, i) => (
                <div
                  key={emp.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i < employees.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <Avatar name={emp.name} px={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>{emp.name}</p>
                    <p className="text-xs font-mono" style={{ color: 'var(--fg)', opacity: 0.4 }}>{shortenAddr(emp.address)}</p>
                  </div>
                  <span className="text-sm font-bold font-mono" style={{ color: 'var(--accent)' }}>${emp.salary}</span>
                </div>
              ))}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderTop: '1px solid var(--border)', background: 'rgba(201,168,76,0.04)' }}
              >
                <span className="text-sm font-bold" style={{ color: 'var(--fg)' }}>Total</span>
                <span className="text-base font-bold font-mono" style={{ color: 'var(--accent)' }}>${totalStr} USDC</span>
              </div>
            </div>

            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs"
              style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)', color: 'var(--fg)', opacity: 0.7 }}
            >
              Make sure MetaMask is connected to Arc Testnet and you have enough USDC.{' '}
              <a
                href="https://faucet.circle.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent)', textDecoration: 'underline', opacity: 1 }}
              >
                Get test USDC ↗
              </a>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('list')}
                className="px-5 py-2.5 rounded-xl text-sm border"
                style={{ border: '1px solid var(--border)', color: 'var(--fg)' }}
              >
                Back
              </button>
              <button
                onClick={runPayroll}
                disabled={employees.length === 0}
                className="sweep flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: 'var(--accent)', color: '#0a0a0a' }}
              >
                <Play size={14} />
                Pay All ({employees.length})
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── List (default) ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <div className="flex flex-col gap-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>Payroll</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--fg)', opacity: 0.5 }}>
                Pay your team in USDC on Arc Testnet
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <label
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-opacity hover:opacity-80"
                style={{ border: '1px solid var(--border)', color: 'var(--fg)' }}
              >
                <Upload size={13} />
                Import CSV
                <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
              </label>
              {employees.length > 0 && (
                <button
                  onClick={handleCSVExport}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-opacity hover:opacity-80"
                  style={{ border: '1px solid var(--border)', color: 'var(--fg)' }}
                >
                  <Download size={13} />
                  Export CSV
                </button>
              )}
              <button
                onClick={() => { setEditTarget(undefined); setModal('add'); }}
                className="sweep flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                style={{ background: 'var(--accent)', color: '#0a0a0a' }}
              >
                <Plus size={13} />
                Add Employee
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div
            className="flex rounded-xl p-1 gap-1"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            {(['employees', 'history'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all"
                style={{
                  background: tab === t ? 'var(--accent)' : 'transparent',
                  color: tab === t ? '#0a0a0a' : 'var(--fg)',
                  opacity: tab === t ? 1 : 0.55,
                }}
              >
                {t === 'employees' ? <Users size={13} /> : <History size={13} />}
                {t === 'employees'
                  ? `Employees${employees.length > 0 ? ` (${employees.length})` : ''}`
                  : `History${runs.length > 0 ? ` (${runs.length})` : ''}`}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'history' ? (
            <HistoryPanel runs={runs} />
          ) : (
            <>
              {employees.length > 3 && (
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--fg)', opacity: 0.4 }}
                  />
                  <input
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-colors"
                    style={inputSt}
                    placeholder="Search employees…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={onFocusAccent}
                    onBlur={onBlurBorder}
                  />
                </div>
              )}

              {employees.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center gap-3 py-20 rounded-2xl"
                  style={{ border: '1px dashed var(--border)' }}
                >
                  <Users size={36} style={{ color: 'var(--fg)', opacity: 0.15 }} />
                  <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.45 }}>
                    No employees yet. Add your first one.
                  </p>
                  <button
                    onClick={() => { setEditTarget(undefined); setModal('add'); }}
                    className="sweep flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium mt-1"
                    style={{ background: 'var(--accent)', color: '#0a0a0a' }}
                  >
                    <Plus size={13} />
                    Add Employee
                  </button>
                </div>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="flex flex-col gap-2 sm:hidden">
                    {filtered.map((emp) => (
                      <div
                        key={emp.id}
                        className="rounded-2xl p-4 flex flex-col gap-3"
                        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={emp.name} px={40} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{emp.name}</p>
                            {emp.role && <p className="text-xs" style={{ color: 'var(--fg)', opacity: 0.5 }}>{emp.role}</p>}
                          </div>
                          <span className="text-sm font-bold font-mono" style={{ color: 'var(--accent)' }}>${emp.salary}</span>
                        </div>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xs font-mono" style={{ color: 'var(--fg)', opacity: 0.4 }}>{shortenAddr(emp.address)}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--fg)', opacity: 0.4 }}>
                              Last paid: {emp.lastPaid ? fmtDate(emp.lastPaid) : 'Never'}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => { setEditTarget(emp); setModal('edit'); }}
                              className="p-2 rounded-lg border transition-opacity hover:opacity-80"
                              style={{ border: '1px solid var(--border)', color: 'var(--fg)' }}
                              aria-label="Edit"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => setConfirmId(emp.id)}
                              className="p-2 rounded-lg border transition-opacity hover:opacity-80"
                              style={{ border: '1px solid var(--border)', color: '#f87171' }}
                              aria-label="Remove"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div
                    className="hidden sm:block rounded-2xl overflow-hidden"
                    style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
                  >
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          {['Employee', 'Address', 'Salary (USDC)', 'Last Paid', ''].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                              style={{ color: 'var(--fg)', opacity: 0.4 }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((emp, i) => (
                          <tr
                            key={emp.id}
                            style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <Avatar name={emp.name} px={32} />
                                <div>
                                  <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>{emp.name}</p>
                                  {emp.role && <p className="text-xs" style={{ color: 'var(--fg)', opacity: 0.45 }}>{emp.role}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-mono" style={{ color: 'var(--fg)', opacity: 0.55 }}>
                                {shortenAddr(emp.address)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-bold font-mono" style={{ color: 'var(--accent)' }}>
                                ${emp.salary}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs" style={{ color: 'var(--fg)', opacity: 0.5 }}>
                                {emp.lastPaid ? fmtDate(emp.lastPaid) : 'Never'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1 justify-end">
                                <button
                                  onClick={() => { setEditTarget(emp); setModal('edit'); }}
                                  className="p-1.5 rounded-lg border transition-opacity hover:opacity-80"
                                  style={{ border: '1px solid var(--border)', color: 'var(--fg)' }}
                                  title="Edit"
                                >
                                  <Edit size={13} />
                                </button>
                                <button
                                  onClick={() => setConfirmId(emp.id)}
                                  className="p-1.5 rounded-lg border transition-opacity hover:opacity-80"
                                  style={{ border: '1px solid var(--border)', color: '#f87171' }}
                                  title="Remove"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filtered.length === 0 && search && (
                      <p className="text-sm text-center py-8" style={{ color: 'var(--fg)', opacity: 0.4 }}>
                        No employees match &ldquo;{search}&rdquo;
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Footer */}
              {employees.length > 0 && (
                <div
                  className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <div>
                    <p className="text-xs" style={{ color: 'var(--fg)', opacity: 0.5 }}>Total to pay</p>
                    <p className="text-xl font-bold font-mono mt-0.5" style={{ color: 'var(--accent)' }}>
                      ${totalStr} <span className="text-sm font-medium">USDC</span>
                    </p>
                    <a
                      href="https://faucet.circle.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs mt-0.5 inline-block"
                      style={{ color: 'var(--accent)', opacity: 0.6 }}
                    >
                      Get test USDC ↗
                    </a>
                  </div>
                  <button
                    onClick={() => setStep('review')}
                    className="sweep flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold"
                    style={{ background: 'var(--accent)', color: '#0a0a0a' }}
                  >
                    <Play size={14} />
                    Run Payroll
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {(modal === 'add' || modal === 'edit') && (
        <EmployeeModal
          initial={editTarget}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {confirmId && (
        <ConfirmRemove
          name={employees.find((e) => e.id === confirmId)?.name ?? ''}
          onConfirm={() => { removeEmployee(confirmId); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
