"use client";

export default function ConfirmModal({
  isOpen,
  title = "אישור פעולה",
  message = "האם אתה בטוח?",
  confirmText = "אישור",
  cancelText = "ביטול",
  onConfirm,
  onCancel,
  isDanger = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">{message}</p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-2xl px-4 py-2 text-sm font-medium text-white transition ${
              isDanger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-black hover:bg-gray-800"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
