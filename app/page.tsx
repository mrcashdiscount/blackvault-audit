'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ArrowRight, Download, AlertCircle, CheckCircle2, Calculator, Shield } from 'lucide-react';

const schema = z.object({
  businessName: z.string().min(1, 'Required'),
  businessPhone: z.string().min(10),
  businessEmail: z.string().email(),
  businessType: z.string().min(1),
  monthlyVolume: z.number().positive(),
  avgTicket: z.number().positive(),
  interchange: z.number().min(0).default(0),
  duesAssessments: z.number().min(0).default(0),
  perItemFee: z.number().min(0).default(0),
  monthlyFee: z.number().min(0).default(0),
  pciFee: z.number().min(0).default(0),
  gatewayFee: z.number().min(0).default(0),
  chargebackFee: z.number().min(0,
  otherFees: z.number().min(0).default(0),
});

type FormData = z.infer<typeof schema>;

export default function BlackVaultAuditTool() {
  const [step, setStep] = useState(1);
  const [currentRate, setCurrentRate] = useState(0);
  const [annualOvercharge, setAnnualOvercharge] = useState(0);

  const { register, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      monthlyVolume: 50000,
      avgTicket: 75,
      interchange: 0,
      duesAssessments: 0,
      perItemFee: 0,
      monthlyFee: 0,
      pciFee: 0,
      gatewayFee: 0,
      chargebackFee: 0,
      otherFees: 0,
    },
  });

  const values = watch();

  // Real-time calculation
  useEffect(() => {
    const vol = values.monthlyVolume || 0;
    const ticket = values.avgTicket || 1;
    const transactions = vol / ticket;

    const totalFees =
      (values.interchange || 0) +
      (values.duesAssessments || 0) +
      (values.monthlyFee || 0) +
      (values.pciFee || 0) +
      (values.gatewayFee || 0) +
      (values.chargebackFee || 0) +
      (values.otherFees || 0) +
      transactions * (values.perItemFee || 0);

    const effectiveRate = vol > 0 ? (totalFees / vol) * 100 : 0;
    const newCostMonthly = vol * 0.0229 + transactions * 0.19;
    const overchargeYearly = (totalFees - newCostMonthly) * 12;

    setCurrentRate(effectiveRate);
    setAnnualOvercharge(Math.max(0, Math.round(overchargeYearly)));
  }, [values]);

  const transactionsPerMonth = (values.monthlyVolume || 0) / (values.avgTicket || 1);

  const rows = [
    { label: 'Interchange & Assessments', amount: (values.interchange || 0) + (values.duesAssessments || 0) },
    { label: 'Per-Item / Auth / Batch Fees', amount: transactionsPerMonth * (values.perItemFee || 0) },
    { label: 'Monthly / Service / Annual Fees', amount: values.monthlyFee || 0 },
    { label: 'PCI Compliance Fees', amount: values.pciFee || 0 },
    { label: 'Gateway / Software Fees', amount: values.gatewayFee || 0 },
    { label: 'Chargeback / Dispute Fees', amount: values.chargebackFee || 0 },
    { label: 'Hidden / Special Fees', amount: values.otherFees || 0 },
  ];

  const generatePDF = async () => {
    const element = document.getElementById('results');
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`BlackVault_Audit_${(values.businessName || 'Report').replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(214,73%,15%)] via-[hsl(214,73%,18%)] to-[hsl(166,60%,38%)] py-12 px-4">
      <div className="max-w-5xl mx-auto text-white">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black mb-4">
            Black Vault <span className="text-[hsl(166,60%,42%)]">Forensic Audit</span>
          </h1>
          <p className="text-xl opacity-90">See exactly how much you’re overpaying — in 60 seconds.</p>
        </div>

        <form onSubmit={handleSubmit(generatePDF)}>
          {step === 1 && (
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl border border-white/20">
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-4">
                <Shield className="w-10 h-10 text-[hsl(166,60%,42%)]" /> Business Information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <input {...register('businessName')} placeholder="Business Name *" className="px-6 py-4 rounded-xl bg-white/90 text-gray-900" />
                <input {...register('businessPhone')} placeholder="Phone *" className="px-6 py-4 rounded-xl bg-white/90 text-gray-900" />
                <input {...register('businessEmail')} type="email" placeholder="Email *" className="px-6 py-4 rounded-xl bg-white/90 text-gray-900" />
                <select {...register('businessType')} className="px-6 py-4 rounded-xl bg-white/90 text-gray-900">
                  <option value="">Select Industry</option>
                  <optgroup label="Low Risk">
                    <option>Restaurant</option>
                    <option>Retail</option>
                    <option>Professional Services</option>
                  </optgroup>
                  <optgroup label="High Risk">
                    <option>E-commerce</option>
                    <option>CBD/Hemp</option>
                  </optgroup>
                </select>
                <input {...register('monthlyVolume', { valueAsNumber: true })} type="number" placeholder="Monthly Volume ($)*" className="px-6 py-4 rounded-xl bg-white/90 text-gray-900" />
                <input {...register('avgTicket', { valueAsNumber: true })} type="number" placeholder="Avg Ticket ($)*" className="px-6 py-4 rounded-xl bg-white/90 text-gray-900" />
              </div>
              <button type="button" onClick={() => setStep(2)} className="mt-10 w-full bg-gradient-to-r from-[hsl(166,60%,42%)] to-emerald-500 font-bold py-5 rounded-xl hover:scale-105 transition flex items-center justify-center gap-3">
                Next: Enter Statement Fees <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          )}

          {step === 2 && (
            <>
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl border border-white/20 mb-10">
                <h2 className="text-3xl font-bold mb-8 flex items-center gap-4">
                  <Calculator className="w-10 h-10 text-[hsl(166,60%,42%)]" /> Monthly Fees from Your Statement
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <input {...register('interchange', { valueAsNumber: true })} type="number" step="0.01" placeholder="Interchange ($)" className="px-6 py-4 rounded-xl bg-white/90 text-gray-900" />
                  <input {...register('duesAssessments', { valueAsNumber: true })} type="number" step="0.01" placeholder="Dues & Assessments ($)" className="px-6 py-4 rounded-xl bg-white/90 text-gray-900" />
                  <input {...register('perItemFee', { valueAsNumber: true })} type="number" step="0.01" placeholder="Per-Item Fee ($)" className="px-6 py-4 rounded-xl bg-white/90 text-gray-900" />
                  <input {...register('monthlyFee', { valueAsNumber: true })} type="number step="0.01" placeholder="Monthly Fee ($)" className="px-6 py-4 rounded-xl bg-white/90 text-gray-900" />
                  <input {...register('pciFee', { valueAsNumber: true })} type="number" step="0.01" placeholder="PCI Fee ($)" className="px-6 py-4 rounded-xl bg-white/90 text-gray-900" />
                  <input {...register('gatewayFee', { valueAsNumber: true })} type="number" step="0.01" placeholder="Gateway Fee ($)" className="px-6 py-4 rounded-xl bg-white/90 text-gray-900" />
                  <input {...register('chargebackFee', { valueAsNumber: true })} type="number" step="0.01" placeholder="Chargeback Fee ($)" className="px-6 py-4 rounded-xl bg-white/90 text-gray-900" />
                  <input {...register('otherFees', { valueAsNumber: true })} type="number" step="0.01" placeholder="Other Hidden Fees ($)" className="px-6 py-4 rounded-xl bg-white/90 text-gray-900" />
                </div>
              </div>

              <div id="results" className="space-y-12">
                {/* Table */}
                <div className="bg-white rounded-3xl p-10 shadow-2xl text-gray-900">
                  <h2 className="text-4xl font-black mb-8">WHERE YOUR MONEY ACTUALLY WENT</h2>
                  <table className="w-full text-lg">
                    <thead className="border-b-4 border-gray-300">
                      <tr>
                        <th className="text-left py-4">Description</th>
                        <th className="text-right py-4">Monthly</th>
                        <th className="text-right py-4 text-red-600 font-bold">12-Month Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className="border-b">
                          <td className="py-4">{row.label}</td>
                          <td className="py-4 text-right">${row.amount.toFixed(2)}</td>
                          <td className="py-4 text-right font-bold text-red-600">${(row.amount * 12).toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="bg-red-50 font-black text-xl">
                        <td colSpan={2} className="py-6 text-right">TOTAL OVERCHARGED</td>
                        <td className="py-6 text-right text-4xl text-red-600">${annualOvercharge.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Rate Comparison */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-red-600 rounded-3xl p-12 text-white text-center">
                    <h3 className="text-3xl font-bold mb-6">CURRENT RATE</h3>
                    <div className="text-7xl font-black">{currentRate.toFixed(2)}%</div>
                  </div>
                  <div className="bg-gradient-to-br from-[hsl(166,60%,42%)] to-emerald-600 rounded-3xl p-12 text-white text-center shadow-2xl">
                    <h3 className="text-3xl font-bold mb-6">NEW RATE WITH BLACK VAULT</h3>
                    <div className="text-6xl font-black">2.29% + $0.19<br /><span className="text-3xl opacity-90">or 4.00% Cash Discount</span></div>
                  </div>
                </div>

                {/* Final Blocks */}
                <div className="grid md:grid-cols-2 gap-8 text-white text-center">
                  <div className="bg-red-600 rounded-3xl p-12">
                    <AlertCircle className="w-24 h-24 mx-auto mb-6" />
                    <h3 className="text-4xl font-black mb-4">YOU HAVE BEEN OVERCHARGED</h3>
                    <div className="text-7xl font-black">${annualOvercharge.toLocaleString()}</div>
                    <p className="mt-4 text-xl">last 12 months</p>
                  </div>
                  <div className="bg-gradient-to-br from-[hsl(166,60%,42%)] to-emerald-600 rounded-3xl p-12 shadow-2xl">
                    <CheckCircle2 className="w-24 h-24 mx-auto mb-6" />
                    <h3 className="text-4xl font-black mb-4">YOU KEEP</h3>
                    <div className="text-7xl font-black">${annualOvercharge.toLocaleString()}</div>
                    <p className="mt-4 text-xl">next 12 months</p>
                  </div>
                </div>

                <div className="text-center mt-12">
                  <button type="submit" className="bg-gradient-to-r from-[hsl(166,60%,42%)] to-emerald-600 text-white font-black text-3xl px-20 py-8 rounded-3xl hover:scale-110 transition shadow-2xl flex items-center gap-6 mx-auto">
                    <Download className="w-12 h-12" />
                    Download Your Forensic Audit PDF
                  </button>
                </div>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
