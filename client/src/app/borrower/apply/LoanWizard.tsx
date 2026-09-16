"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import { Notice } from "@/components/Notice";
import { calculateLoanPreview, formatCurrency } from "@/lib/format";
import type { Loan } from "@/types";

// --- 1. SCHEMAS & TYPES ---

const personalDetailsSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  pan: z
    .string()
    .min(1, "PAN is required")
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, "Invalid PAN format (e.g., ABCDE1234F)")
    .transform((v) => v.toUpperCase()),
  dateOfBirth: z.string().refine((val) => {
    if (isNaN(Date.parse(val))) return false;
    const age = (new Date().getTime() - new Date(val).getTime()) / (1000 * 60 * 60 * 24 * 365);
    return age >= 23 && age <= 50;
  }, "Age must be between 23 and 50 years"),
  monthlySalary: z.number().min(25000, "Monthly salary must be at least ₹25,000"),
  employmentMode: z.enum(["Salaried", "Self-Employed", "Unemployed"]),
});

type PersonalDetailsData = z.infer<typeof personalDetailsSchema>;

// --- 2. WIZARD COMPONENT ---

export function LoanWizard({
  loan,
  onRefresh,
}: {
  loan: Loan | null;
  onRefresh: () => Promise<void>;
}) {
  const { user } = useAuth();
  
  // If the user has a loan that is past LEAD, block them
  const isLocked = loan && !["NO_LOAN", "BRE_REJECTED", "LEAD", "REJECTED"].includes(loan.status);

  const [step, setStep] = useState(loan?.status === "LEAD" ? 2 : 1);
  const [error, setError] = useState("");
  const [rejectionReasons, setRejectionReasons] = useState<string[]>([]);
  
  // Step 2 State
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Step 3 State
  const [principal, setPrincipal] = useState(100000);
  const [tenureDays, setTenureDays] = useState(180);
  const [isApplying, setIsApplying] = useState(false);

  // Form handling
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<PersonalDetailsData>({
    mode: "onTouched",
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      fullName: user?.profile?.fullName || user?.name || "",
      pan: user?.profile?.pan || "",
      dateOfBirth: user?.profile?.dateOfBirth ? new Date(user.profile.dateOfBirth).toISOString().split('T')[0] : "",
      monthlySalary: user?.profile?.monthlySalary || 30000,
      employmentMode: user?.profile?.employmentMode || "Salaried",
    },
  });

  const watchedFullName = watch("fullName");
  const [showNameAlert, setShowNameAlert] = useState(false);
  const [nameAlertAccepted, setNameAlertAccepted] = useState(false);

  // Clean up object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  if (isLocked) {

    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-blue-900">Application Successfully Submitted</h2>
        <p className="mt-2 text-sm text-blue-800 max-w-md mx-auto">
          Thank you for applying! Your loan application is currently under review by our team. 
          Please head over to the <strong>Loan Status</strong> tab to track its progress.
        </p>
      </div>
    );
  }

  const handleError = (err: unknown) => {
    if (err instanceof ApiError) {
      setError(err.message);
      setRejectionReasons(err.rejectionReasons ?? []);
      return;
    }
    setError(err instanceof Error ? err.message : "Something went wrong");
  };

  const clearFeedback = () => {
    setError("");
    setRejectionReasons([]);
  };

  // --- HANDLERS ---

  const onPersonalDetailsSubmit = async (data: PersonalDetailsData) => {
    clearFeedback();

    if (data.fullName !== user?.name && !nameAlertAccepted) {
      setShowNameAlert(true);
      return;
    }

    try {
      await api.submitDetails(data);
      await onRefresh();
      setStep(2);
    } catch (err) {
      handleError(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      setFilePreview(null);
      return;
    }
    setFile(selected);
    setFilePreview(URL.createObjectURL(selected));
  };

  const onUploadSubmit = async () => {
    if (!file) return;
    clearFeedback();
    setIsUploading(true);
    try {
      await api.uploadSalarySlip(file);
      await onRefresh();
      setStep(3);
    } catch (err) {
      handleError(err);
    } finally {
      setIsUploading(false);
    }
  };

  const onApplySubmit = async () => {
    clearFeedback();
    setIsApplying(true);
    try {
      await api.applyForLoan({ principal, tenureDays });
      await onRefresh();
      // Wizard complete, status will now be APPLIED, so the lock screen will appear
    } catch (err) {
      handleError(err);
    } finally {
      setIsApplying(false);
    }
  };

  const renderError = () => {
    if (!error) return null;
    return (
      <div className="mb-6">
        <Notice type="error" title={error}>
          {rejectionReasons.length ? (
            <ul className="list-inside list-disc mt-2 space-y-1 text-sm">
              {rejectionReasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          ) : null}
        </Notice>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Tracker */}
      <div className="mb-8 flex items-center justify-between relative z-0">
        <div className="absolute left-0 top-1/2 -z-10 h-1 w-full -translate-y-1/2 bg-slate-200"></div>
        <div className="absolute left-0 top-1/2 -z-10 h-1 -translate-y-1/2 bg-blue-600 transition-all duration-500 ease-in-out" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white text-sm font-bold transition-colors ${
              step >= i ? "border-blue-600 text-blue-600" : "border-slate-300 text-slate-400"
            }`}
          >
            {i}
          </div>
        ))}
      </div>

      {renderError()}

      {/* Name Alert Modal */}
      {showNameAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Applying on someone else's behalf?</h3>
            <p className="mt-2 text-sm text-slate-600">
              The name you entered ({watchedFullName}) is different from your registered name ({user?.name}). That's okay, just let us know you want to proceed!
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowNameAlert(false)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setNameAlertAccepted(true);
                  setShowNameAlert(false);
                  handleSubmit(onPersonalDetailsSubmit)();
                }}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Yes, proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wizard Steps */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <AnimatePresence mode="wait">
          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              className="p-6 md:p-8"
            >
              <h2 className="text-xl font-semibold text-slate-900">Personal Details</h2>
              <p className="mt-1 text-sm text-slate-500">Provide your details for the eligibility check.</p>

              <form onSubmit={handleSubmit(onPersonalDetailsSubmit)} className="mt-6 space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</label>
                  <input
                    {...register("fullName")}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">PAN</label>
                  <input
                    {...register("pan")}
                    placeholder="ABCDE1234F"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm uppercase outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.pan && (
                    <div className="mt-1.5 rounded bg-amber-50 p-2 text-xs text-amber-900 border border-amber-200">
                      ⚠️ {errors.pan.message}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Date of Birth</label>
                  <input
                    type="date"
                    {...register("dateOfBirth")}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.dateOfBirth && (
                    <div className="mt-1.5 rounded bg-amber-50 p-2 text-xs text-amber-900 border border-amber-200">
                      ⚠️ {errors.dateOfBirth.message}
                    </div>
                  )}
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Monthly Salary (₹)</label>
                    <input
                      type="number"
                      {...register("monthlySalary", { valueAsNumber: true })}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.monthlySalary && (
                      <div className="mt-1.5 rounded bg-amber-50 p-2 text-xs text-amber-900 border border-amber-200">
                        ⚠️ {errors.monthlySalary.message}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Employment Mode</label>
                    <select
                      {...register("employmentMode")}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Salaried">Salaried</option>
                      <option value="Self-Employed">Self-Employed</option>
                      <option value="Unemployed">Unemployed</option>
                    </select>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "Checking..." : "Verify & Next"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* STEP 2: Salary Slip */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              className="p-6 md:p-8"
            >
              <h2 className="text-xl font-semibold text-slate-900">Upload Salary Slip</h2>
              <p className="mt-1 text-sm text-slate-500">Please provide your latest salary slip (JPG, PNG, or PDF).</p>

              <div className="mt-6">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                />

                {filePreview && (
                  <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
                    {file?.type.includes("pdf") ? (
                      <iframe src={`${filePreview}#view=FitH&toolbar=0`} className="w-full h-96 rounded" title="PDF Preview" />
                    ) : (
                      <img src={filePreview} alt="Preview" className="max-h-64 mx-auto object-contain rounded" />
                    )}
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-md border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={onUploadSubmit}
                  disabled={!file || isUploading}
                  className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUploading ? "Uploading..." : "Next"}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Loan Config */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              className="p-6 md:p-8"
            >
              <h2 className="text-xl font-semibold text-slate-900">Configure Loan</h2>
              <p className="mt-1 text-sm text-slate-500">Adjust the amount and tenure to fit your needs.</p>

              <div className="mt-8 space-y-8">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Principal Amount</label>
                    <span className="text-lg font-semibold text-slate-900">{formatCurrency(principal)}</span>
                  </div>
                  <input
                    type="range"
                    min={50000}
                    max={500000}
                    step={10000}
                    value={principal}
                    onChange={(e) => setPrincipal(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="mt-1 flex justify-between text-xs text-slate-500">
                    <span>₹50K</span>
                    <span>₹5L</span>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Tenure (Days)</label>
                    <span className="text-lg font-semibold text-slate-900">{tenureDays} days</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={365}
                    step={5}
                    value={tenureDays}
                    onChange={(e) => setTenureDays(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="mt-1 flex justify-between text-xs text-slate-500">
                    <span>30d</span>
                    <span>365d</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-md border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Confirm details
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Review & Apply */}
          {step === 4 && (() => {
            const preview = calculateLoanPreview(principal, tenureDays);
            return (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
                className="p-6 md:p-8"
              >
                <h2 className="text-xl font-semibold text-slate-900">Review & Apply</h2>
                <p className="mt-1 text-sm text-slate-500">Please review your final loan details before applying.</p>

                <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <th className="bg-slate-50 px-4 py-3 font-medium text-slate-600 w-1/3">Principal Amount</th>
                        <td className="px-4 py-3 text-slate-900">{formatCurrency(principal)}</td>
                      </tr>
                      <tr>
                        <th className="bg-slate-50 px-4 py-3 font-medium text-slate-600">Tenure</th>
                        <td className="px-4 py-3 text-slate-900">{tenureDays} days</td>
                      </tr>
                      <tr>
                        <th className="bg-slate-50 px-4 py-3 font-medium text-slate-600">Interest Rate</th>
                        <td className="px-4 py-3 text-slate-900">{preview.interestRate}% p.a.</td>
                      </tr>
                      <tr>
                        <th className="bg-slate-50 px-4 py-3 font-medium text-slate-600">Total Interest</th>
                        <td className="px-4 py-3 text-slate-900">{formatCurrency(preview.interestAmount)}</td>
                      </tr>
                      <tr>
                        <th className="bg-slate-50 px-4 py-3 font-medium text-slate-900 text-base">Total Repayment</th>
                        <td className="px-4 py-3 font-semibold text-slate-900 text-base">{formatCurrency(preview.totalRepayment)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="rounded-md border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                    disabled={isApplying}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={onApplySubmit}
                    disabled={isApplying}
                    className="rounded-md bg-green-600 px-8 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                  >
                    {isApplying ? "Submitting..." : "Apply Now"}
                  </button>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
}
