import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { StatusPill } from '../components/UI'
import { InvoiceDB, fmtIDR, fmtShort, initials } from '../utils/db'
import { t, tf, getLang } from '../utils/i18n'

export default function Dashboard() {
  const { navigate, invoices, profile, markAsPaid, showToast, lang } = useApp()
  const stats     = InvoiceDB.stats()
  const reminders = InvoiceDB.getReminders()
  const monthly   = InvoiceDB.monthlyData()
  const recent    = invoices.slice(0, 8)
  const maxV      = Math.max(...monthly.map(m => m.invoiced), 1)
  const brandColor = (profile?.color === '#ffffff' || profile?.color === '#F8FAFC') ? '#085041' : profile?.color || '#085041'

  const sendReminder = (inv) => {
    const bal = Math.max(0, (inv.total || 0) - (inv.paid || 0))
    const msg = tf('reminderMsg', inv.clientName, inv.num, bal.toLocaleString('id-ID'), inv.due)
    const phone = inv.clientPhone || ''
    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  return (
    <div className="flex flex-col min-h-full pb-4">
      {/* header */}
      <div style={{ background: brandColor }} className="px-4 pt-4 pb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-white/60 text-[12px]">{t('welcomeBack')}</div>
            <div className="text-white font-medium text-[17px]">{profile?.bizName || 'Faktur Kita'}</div>
          </div>
          <button onClick={() => navigate('invoice-form')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 text-white text-[12px] font-medium border-none cursor-pointer">
            + {t('newInvoice')}
          </button>
        </div>
        {/* stat cards */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: t('revenue'),     val: fmtShort(stats.totalInvoiced), color:'#fff' },
            { label: t('collected'),   val: fmtShort(stats.totalCollected), color:'#4ade80' },
            { label: t('outstanding'), val: fmtShort(stats.outstanding), color:'#fbbf24' },
            { label: t('overdue'),     val: stats.overdueCount, color:'#f87171' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-xl px-3 py-2.5">
              <div className="text-white/50 text-[10px] uppercase tracking-wider">{s.label}</div>
              <div className="text-[18px] font-medium mt-0.5" style={{ color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* reminders */}
      {reminders.length > 0 && (
        <div className="mx-3 mt-3 bg-red-50 border border-red-200 rounded-xl overflow-hidden">
          <div className="px-3 py-2 flex items-center gap-2">
            <span className="text-[14px]">🔔</span>
            <div className="flex-1">
              <div className="text-[12px] font-medium text-red-800">{t('reminderTitle')}</div>
              <div className="text-[10px] text-red-600">{reminders.length} {t('reminderDesc')}</div>
            </div>
          </div>
          {reminders.slice(0, 3).map(inv => (
            <div key={inv.id} className="flex items-center gap-2 px-3 py-2 border-t border-red-100">
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-red-900 truncate">{inv.clientName}</div>
                <div className="text-[10px] text-red-600">
                  {inv.num} · {fmtIDR(inv.balance)} ·{' '}
                  {inv.urgency === 'overdue' ? `${Math.abs(inv.diffDays)} ${t('daysPastDue')}` :
                   inv.urgency === 'today' ? t('dueToday') :
                   `${inv.diffDays} ${t('daysLeft')}`}
                </div>
              </div>
              <button onClick={() => sendReminder(inv)}
                className="text-[10px] px-2.5 py-1.5 rounded-lg bg-green-600 text-white border-none cursor-pointer whitespace-nowrap font-medium">
                📱 {t('sendReminder')}
              </button>
              <button onClick={() => markAsPaid(inv.id)}
                className="text-[10px] px-2.5 py-1.5 rounded-lg bg-white border border-red-200 text-red-700 cursor-pointer whitespace-nowrap font-medium">
                ✓ {t('markAsPaid')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* real monthly chart */}
      <div className="mx-3 mt-3 bg-white rounded-xl border border-slate-200 p-3">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-3">{t('monthlyRevenue')}</div>
        <div className="flex items-end gap-1.5 h-16">
          {monthly.map((m, i) => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-sm transition-all"
                style={{
                  height: Math.max(4, Math.round((m.invoiced / maxV) * 56)),
                  background: i === monthly.length - 1 ? brandColor : '#e2e8f0'
                }} />
              <span className="text-[9px] text-slate-400">{m.label}</span>
            </div>
          ))}
        </div>
        {monthly[monthly.length-1]?.invoiced > 0 && (
          <div className="text-[10px] text-slate-400 mt-2 text-center">
            {monthly[monthly.length-1].label}: {fmtIDR(monthly[monthly.length-1].invoiced)}
          </div>
        )}
      </div>

      {/* recent invoices */}
      <div className="mx-3 mt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-400">{t('recentInvoices')}</span>
          <button onClick={() => navigate('invoices')} className="text-[11px] font-medium bg-none border-none cursor-pointer" style={{ color: brandColor }}>
            {t('viewAll')} →
          </button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {recent.length === 0
            ? <div className="py-8 text-center">
                <div className="text-3xl mb-2">📄</div>
                <div className="text-sm text-slate-400 mb-3">{t('noData')}</div>
                <button onClick={() => navigate('invoice-form')}
                  className="text-[12px] px-4 py-2 rounded-lg border-none text-white cursor-pointer" style={{ background: brandColor }}>
                  + {t('newInvoice')}
                </button>
              </div>
            : recent.map(inv => (
              <button key={inv.id} onClick={() => navigate('invoice-preview', inv)}
                className="w-full flex items-center gap-3 px-3 py-2.5 border-b border-slate-100 last:border-0 bg-none cursor-pointer text-left hover:bg-slate-50">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0"
                  style={{ background: '#E1F5EE', color: brandColor }}>
                  {initials(inv.clientName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-slate-800 truncate">{inv.clientName}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{inv.num} · {inv.date}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[12px] font-medium text-slate-800">{fmtShort(inv.total)}</div>
                  <StatusPill status={inv.status} />
                </div>
              </button>
            ))
          }
        </div>
      </div>
    </div>
  )
}
