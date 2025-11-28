'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ArrowRight, Download, AlertCircle, CheckCircle2, Calculator, Shield, Zap } from 'lucide-react';

const schema = z.object({
  businessType: z.string().min(1, 'Required'),
  businessName: z.string().min(1, 'Required'),
  businessPhone: z.string().min(10, 'Valid phone required'),
  businessEmail: z.string().email('Valid email required'),
  monthlyVolume: z.number().min(1000),
  avgTicket: z.number().min(5),
  interchange: z.number().default(0),
  duesAssessments: z.number().default(0),
  perItemFee: z.number().default(0),
  monthlyFee: z.number().default(0),
  pciFee: z.number().default(0),
  gatewayFee: z.number().default(0),
  chargebackFee: z.number().default(0),
  otherFees: z.number().default(0),
});

type FormData = z.infer<typeof schema>;

export default function BlackVaultAuditTool() {
  const [step, setStep] = useState(1);
  const [currentEffectiveRate, setCurrentEffectiveRate] = useState(0);
  const [annualOvercharge, setAnnualOvercharge] = useState(0);
  const [annualSavings, setAnnualSavings] = useState(0);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      monthlyVolume: 50000,
      avgTicket: 75,
    },
  });

  const values = watch();

  useEffect(() => {
    const vol = values.monthlyVolume || 0;
    const ticket = values.avgTicket || 1;
    const transactions = vol / ticket;

    const monthlyFees = 
      (values.interchange || 0) +
      (values.duesAssessments || 0) +
      (values.monthlyFee || 0) +
      (values.pciFee || 0) +
      (values.gatewayFee || 0) +
      (values.chargebackFee || 0) +
      (values.otherFees || 0) +
      (transactions * (values.perItemFee || 0));

    const effective = vol > 0 ? (monthlyFees / vol) * 100 : 0;

    const newCost = vol * 0.0229 + transactions * 0.19;
    const overcharge = (monthlyFees - newCost) * 12;

    setCurrentEffectiveRate(effective);
    setAnnualOvercharge(Math.max(0, Math.round(overcharge)));
    setAnnualSavings(Math.max(0, Math.round(overcharge)));
  }, [values]);

  const transactionsPerMonth = (values.monthlyVolume || 0) / (values.avgTicket || 1);

  const feeRows = [
    { desc: 'Interchange & Assessments', amount: (values.interchange || 0) + (values.duesAssessments || 0) },
    { desc: 'Per-Item / Auth / Batch Fees', amount: transactionsPerMonth * (values.perItemFee || 0) },
    { desc: 'Monthly / Service / Annual Fees', amount: values.monthlyFee || 0 },
    { desc: 'PCI Compliance Fees', amount: values.pciFee || 0 },
    { desc: 'Gateway / Software Fees', amount: values.gatewayFee || 0 },
    { desc: 'Chargeback / Dispute Fees', amount: values.chargebackFee || 0 },
    { desc: 'Hidden / Special Fees', amount: values.otherFees || 0 },
  ];

  const exportPDF = async () => {
    const el = document.getElementById('results');
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const img = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(img, 'PNG, 0, 0, w, h);
    pdf.save(`BlackVault_Audit_${values.businessName || 'Report'}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(214,73%,15%)] via-[hsl(214,73%,18%)] to-[hsl(166,60%,38%)] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-white mb-4">
            Black Vault <span className="text-[hsl(166,60%,42%)]">Forensic Audit</span>
          </h1>
          <p className="text-xl text-white/80">Uncover hidden fees in 60 seconds.</p>
        </div>

        <form onSubmit={handleSubmit(exportPDF)}>
          {step === 1 && (
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-4">
                <Shield className="w-10 h-10 text-[hsl(166,60%,42%)]" /> Business Info
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <input {...register('businessName')} placeholder="Business Name *" className="px-5 py-4 rounded-xl bg-white/90" />
                <input {...register('businessPhone')} placeholder="Phone *" className="px-5 py-4 rounded-xl bg-white/90" />
                <input {...register('businessEmail')} type="email" placeholder="Email *" className="px-5 py-4 rounded-xl bg-white/90" />
                <select {...register('businessType')} className="px-5 py-4 rounded-xl bg-white/90">
                  <option value="">Select Industry...</option>
                  <optgroup label="Low Risk"><option>Restaurant</option><option>Retail</option></optgroup>
                  <optgroup label="High Risk"><option>E-commerce</option><option>CBD</option></optgroup>
                </select>
                <input {...register('monthlyVolume', { valueAsNumber: true })} type="number" placeholder="Monthly Volume ($)*" className="px-5 py-4 rounded-xl bg-white/90" />
                <input {...register('avgTicket', { valueAsNumber: true })} type="number" placeholder="Avg Ticket ($)*" className="px-5 py-4 rounded-xl bg-white/90" />
              </div>
              <button type="button" onClick={() => setStep(2)} className="mt-8 w-full bg-gradient-to-r from-[hsl(166,60%,42%)] to-emerald-500 text-white font-bold py-5 rounded-xl hover:scale-105 transition flex items-center justify-center gap-3">
                Next: Enter Statement Fees <ArrowRight />
              </button>
            </div>
          )}

          {step === 2 && (
            <>
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/20 mb-8">
                <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-4">
                  <Calculator className="w-10 h-10 text-[hsl(166,60%,42%)]" /> Statement Fees (Monthly)
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {['interchange', 'duesAssessments', 'perItemFee', 'monthlyFee', 'pciFee', 'gatewayFee', 'chargebackFee', 'otherFees'].map(f => (
                    <input key={f} {...register(f, { valueAsNumber: true })} type="number" step="0.01" placeholder={f.replace(/([A-Z])/g, ' $1').trim()} className="px-5 py-4 rounded-xl bg-white/90" />
                  ))}
                </div>
              </div>

              <div id="results" className="space-y-10">
                {/* Table */}
                <div className="bg-white rounded-3xl p-10 shadow-2xl">
                  <h2 className="text-4xl font-bold mb-8">WHERE YOUR MONEY ACTUALLY WENT</h2>
                  <table className="w-full">
                    <thead className="border-b-4">
                      <tr>
                        <th className="text-left py-4">Description</th>
                        <th className="text-right py-4">Amount</th>
                        <th className="text-right py-4 text-red-600">12-Mo Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeRows.map((r, i) => (
                        <tr key={i} className="border-b">
                          <td className="py-4">{r.desc}</td>
                          <td className="py-4 text-right">${r.amount.toFixed(2)}</td>
                          <td className="py-4 text-right font-bold text-red-600">${(r.amount * 12).toFixed(0)}</td>
                        </tr>
                      ))}
                      <tr className="bg-red-50">
                        <td colSpan={2} className="py-6 text-right text-2xl font-black">TOTAL OVERCHARGED</td>
                        <td className="py-6 text-right text-4xl font-black text-red-600">${annualOvercharge.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Rate Bars */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-red-600 rounded-3xl p-12 text-white text-center">
                    <h3 className="text-2xl font-bold mb-6">CURRENT RATE</h3>
                    <div className="text-7xl font-black">{currentEffectiveRate.toFixed(2)}%</div>
                    <p className="mt-6 text-xl">Your rate is {(currentEffectiveRate - 2.29).toFixed(2)}% too high</p>
                  </div>
                  <div className="bg-gradient-to-br from-[hsl(166,60%,42%)] to-emerald-500 rounded-3xl p-12 text-white text-center shadow-2xl">
                    <h3 className="text-2xl font-bold mb-6">NEW RATE</h3>
                    <div className="text-6xl font-black">2.29% + $0.19<br /><span className="text-3xl opacity-90">or 4% Cash Discount</span></div>
                  </div>
                </div>

                {/* Final CTA */}
                <div className="grid md:grid-cols-2 gap-8 text-white">
                  <div className="bg-red-600 rounded-3xl p-12 text-center">
                    <AlertCircle className="w-24 h-24 mx-auto mb-6" />
                    <h3 className="text-4xl font-black mb-4">YOU HAVE BEEN OVERCHARGED</h3>
                    <div className="text-7xl font-black">${annualOvercharge.toLocaleString()}</div>
                    <p className="mt-4 text-xl">last 12 months</p>
                  </div>
                  <div className="bg-gradient-to-br from-[hsl(166,60%,42%)] to-emerald-600 rounded-3xl p-12 text-center shadow-2xl">
                    <CheckCircle2 className="w-24 h-24 mx-auto mb-6" />
                    <h3 className="text-4xl font-black mb-4">YOU KEEP</h3>
                    <div className="text-7xl font-black">${annualSavings.toLocaleString()}</div>
                    <p className="mt-4 text-xl">next 12 months</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-12">
                <button type="submit" className="bg-gradient-to-r from-[hsl(166,60%,42%)] to-emerald-600 text-white font-black text-2xl px-16 py-6 rounded-2xl hover:scale-110 transition flex items-center gap-6 shadow-2xl">
                  <Download PDF Report <Download className="w-10 h-10" />
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
